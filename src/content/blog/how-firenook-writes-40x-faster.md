---
title: How Firenook writes 40× faster than the Firebase emulator
description: 'What a Firestore write costs in Firenook, read from the source: a journal write, a redb commit without a sync, a few index entries and a wake-up.'
date: 2026-10-22
---

Under a real application's traffic, Firenook 0.2.0 acknowledged a Firestore
write in 5.1 ms at the median, where the official emulator took 208.2 ms.
This post explains that number from Firenook's source: what a write does,
what it skips, what that costs in durability, and where the comparison stops
holding.

## What the 40× measures

The number comes from two hours of one application's traffic against each
emulator in turn: two busy sessions writing, open listeners, a filtered query
every 15 seconds, a Firestore-triggered function and Storage uploads. The
client timed each of the 5,280 writes per emulator, from call to answer.

| Median / 99th percentile | Official | Firenook |
| --- | ---: | ---: |
| Write, acknowledged | 208.2 / 279.8 ms | 5.1 / 50.6 ms |
| Listener update after a write | 209 / 258 ms | 11 / 60 ms |

It is not the cost of a write on an idle emulator. With each emulator alone,
writing a document and deleting it took 3.01 ms on the official emulator and
1.96 ms on Firenook at the median: 1.5×. The 40× is how the two behave under
load, so the real question is narrower than the title: why does a Firenook
write stay cheap while an application runs around it?

## What a write does

A commit enters the disk store through `DiskStore::commit_observed` in
`crates/core-store/src/disk.rs`. It takes five steps.

1. **Read what it touches.** The store reads the documents the commit writes
   from redb, one key lookup each. It never reads the collection.
2. **Plan.** It applies each write to those documents in memory:
   preconditions, transforms such as server timestamps and increments, and
   the new revision. The result is a list of changes, each with the document
   before and after.
3. **Append to the journal.** The commit is framed (a magic number, its
   length and a CRC32C) and appended to a journal file with a plain `write`.
   No `fsync`.
4. **Commit to redb.** redb is an embedded key-value store written in Rust,
   built on copy-on-write B-trees. One write transaction stores the document,
   its entries in the collection, collection-group and ordered field
   indexes, and the store's revision. It commits with redb's
   `Durability::None`, so it does not sync either.
5. **Record and notify.** The change goes into an in-memory change log,
   bounded at 4,096 changes or 64 MiB, and the commit's observers hear about
   it. Then the client gets its answer.

The choice in step 4 is one function:

```rust
const fn redb_durability(durability: DiskDurability) -> Durability {
    match durability {
        DiskDurability::PerCommit => Durability::Immediate,
        DiskDurability::WriteBehind { .. } => Durability::None,
    }
}
```

The gRPC and WebChannel fronts, which the SDKs talk to, run disk commits one
at a time on a blocking thread, off the async workers that serve reads. None
of the five steps reads more than the documents being written, and none
depends on how many listeners are open. That is most of the answer.

## Durability: write-behind, not per commit

Skipping `fsync` does not lose writes when the process dies. The journal
`write` hands the bytes to the operating system, which keeps them, and the
next open replays every journal record newer than redb's last durable
revision, stopping at a torn tail by its checksum. Once a second, a thread
called `firenook-disk-flusher` syncs the journal, makes one empty durable redb
commit, which persists every earlier one, and truncates the journal; a clean
stop does the same. A killed process loses no acknowledged write. A kernel
crash or a power cut loses at most the last second.

`--durability per-commit` syncs on every commit instead. We measured the
difference on an Apple M2 Pro laptop with Firestore alone, on 0.2.0-next.6,
in the shape of the benchmark's write check: 2,000 sequential writes through
the Admin SDK, each confirmed by a listener, then 4,000 writes from eight
writers at once. Two alternating rounds per mode, each on a fresh store:

| | Write-behind (default) | Per commit |
| --- | ---: | ---: |
| Write, median | 0.24–0.31 ms | 15.1–15.8 ms |
| Write, 99th percentile | 0.80–1.39 ms | 29.7–50.3 ms |
| Listener update, median | 0.35–0.44 ms | 15.2–16.0 ms |
| Eight writers | 8,079–11,704 writes/s | 61–63 writes/s |

Syncing every commit is right for data you cannot recreate. For emulator
data, a one-second window on a power cut is a better trade than 50 to 65
times the write latency. The official emulator writes its data only when it
exports, so a crash loses everything since the last export.

## Indexes on the write path

Each write keeps three indexes. The collection and collection-group indexes
take one entry each. The ordered field index takes one for every top-level
field: its key is the collection and field, then the value encoded so that
its bytes sort in the query engine's order, then the document's id. Integers
and doubles share one numeric order, strings and bytes up to 64 bytes are
keyed exactly, and longer ones by a prefix and a 16-byte digest. Arrays,
maps and vectors are keyed by their type and whether they are empty, so an
order over a field still reaches every document holding it. On an update,
the commit reads the document's current entries in the same transaction and
writes only the difference.

Earlier releases kept an equality index on scalar values only. 0.2.0 indexes
every top-level field in order, and that is still a few small B-tree inserts
per write. To check that it costs nothing measurable, 0.2.0-next.8 and 0.2.0
took turns on fresh copies of the same store on the benchmark server: the
write medians were 0.67 and 0.61 ms on 0.2.0-next.8, and 0.67 and 0.62 ms on
0.2.0, and eight writers reached 2,919 to 3,374 writes a second on both.

The index pays off on reads. An `==` or `in` filter reads only the documents
holding the value, joining several filters by seeking each to the largest id
any of them is at. An `orderBy`, a range or a cursor walks the field's
entries from the right place and stops once it has enough, checking equality
filters on other fields against the index before it reads a document. In the
benchmark an equality on a string field took 20.0 ms against 124 ms, and an
`orderBy` with a limit of 20 took 12.0 ms against 96.3 ms.

## Memory that does not grow with the data

Firenook keeps documents in redb on disk, behind a page cache with a 64 MiB
budget. After a commit, the store's in-memory map of documents is empty
again; what stays is the revision, recent commit times and the bounded change
log. Over the two hours, Firenook's process went from 1.64 GiB to 1.67 GiB.
The official emulator, which keeps all its data in its Java heap, went from
15.42 GiB to 22.57 GiB, and used 1,586 s of CPU time against Firenook's
616 s.

What the record does not show is where the official emulator's 200 ms go. It
measures both emulators from outside, and we will not guess at the inside of
a JVM we did not profile. It does rule one explanation out: the official stack
paged to swap during the run, but its write median, 208 ms, is within a few
percent of an earlier run on the same server in which neither stack swapped.

## Listener fan-out

A commit does not wait for listeners. Its observer publishes the new revision
on a watch channel and returns. Each listen stream wakes on that channel,
reads the change log since the revision it last saw, and for each key in its
targets' scope checks whether the document now matches. The view is updated
in place, a document entering, changing or leaving, without running the query
again. Only a document leaving a full `limit` window, or moving inside one,
makes a target run its query, since only the store knows which document fills
the gap. This work runs on a bounded pool of read threads, off the commit's
path. Until 0.2.0-next.2, listen streams polled every 10 ms instead.

In the benchmark, all 60,000 listener updates per emulator arrived, 11 ms
after the write at the median on Firenook and 209 ms on the official
emulator. One difference showed up: the official emulator notifies a listener
about a document its filter excludes, and Firenook does not. A journey of the
application that waited on such a notification ran longer on Firenook; it is
not an emulator latency, and the benchmark leaves it out.

## The six shapes it used to lose

In the 0.2.0-next.6 benchmark the official emulator answered six of the 26
query shapes faster, because Firenook had no ordered index: a query that
ordered or range-filtered a collection read every document in its scope,
10,918 here. 0.2.0 walks the index instead, and writes a batch get's stored
documents straight into the reply:

| Shape, median | 0.2.0-next.8 | 0.2.0 | Official |
| --- | ---: | ---: | ---: |
| orderBy an integer field, limit 20 | 177 ms | 12.0 ms | 96.3 ms |
| orderBy a timestamp, descending, limit 20 | 198 ms | 24.7 ms | 109 ms |
| Range on an integer field, limit 20 | 174 ms | 13.2 ms | 95.5 ms |
| `==` plus orderBy on another field | 107 ms | 14.7 ms | 99.3 ms |
| Five cursor pages of 20 | 875 ms | 74.8 ms | 489 ms |
| Batch get of 50 documents | 115 ms | 43.8 ms | 80.6 ms |

The walk stops at the 20 documents asked for, however large the collection.
On the same data grown to 2.7 million documents, the four ordered and
filtered queries measured there answered in 3 to 6 ms. The official emulator, on Java's default
settings, ran out of memory loading that data at the first query; with a
24 GiB heap it answered each in 8 to 28 seconds.

Firenook is now faster on 25 of the 26 shapes and ties on the last: 500
document ids with no fields, 98.3 ms against 97.8 ms, because it reads each
document whole before dropping its fields. A store an earlier release wrote
builds the ordered index once, on 0.2.0's first start: 7.4 s for 211,202
documents, 49 s for 2.7 million.

## How it was measured

One AMD Ryzen 5 3600 server with 64 GiB and NVMe storage, on Ubuntu 24.04 and
Node 24.20.0, ran one emulator at a time from a clean start, with nothing
else running: firebase-tools 15.22.0 on Java 26 with its default settings,
then Firenook 0.2.0 with its defaults. Both had the same data, the same
application revision and the same workload, and the run fails unless both
end with identical data. An independent audit recomputed every figure from
the raw samples.

The numbers are kept in
[`benchmarks/020-paired-acceptance.json`](https://github.com/firenook-dev/firenook/blob/main/benchmarks/020-paired-acceptance.json),
and [the benchmarks page](/benchmarks) has the method and its limits. It is
one server and one application, so measure your own workload.

To use these write semantics for your own data, read
[Keep data between runs](/docs/data/keep-data).
