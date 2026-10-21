---
title: How Firenook writes 38× faster than the Firebase emulator
description: 'What a Firestore write costs in Firenook, read from the source: a journal write, a redb commit without a sync, a few index entries and a wake-up.'
date: 2026-10-21
---

Under a real application's traffic, Firenook acknowledged a Firestore write
in 5.3 ms at the median, where the official emulator took 202.8 ms. This post
explains that number from Firenook's source: what a write does, what it
skips, what that costs in durability, and where the comparison stops holding.

## What the 38× measures

The number comes from two hours of one application's traffic against each
emulator in turn: two busy sessions writing, open listeners, a filtered query
every 15 seconds, a Firestore-triggered function and Storage uploads. The
client timed each of the 5,280 writes per emulator, from call to answer.

| Median / 99th percentile | Official | Firenook |
| --- | ---: | ---: |
| Write, acknowledged | 202.8 / 267.3 ms | 5.3 / 53.7 ms |
| Listener update after a write | 203 / 257 ms | 11 / 62 ms |

It is not the cost of a write on an idle emulator. With each emulator alone,
writing a document and deleting it took 3.35 ms on the official emulator and
2.07 ms on Firenook at the median: 1.6×. The 38× is how the two behave under
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
   its entries in the collection, collection-group and equality field
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
difference on an Apple M2 Pro laptop with Firestore alone, in the shape of the
benchmark's write check: 2,000 sequential writes through the Admin SDK, each
confirmed by a listener, then 4,000 writes from eight writers at once. Two
alternating rounds per mode, each on a fresh store:

| | Write-behind (default) | Per commit |
| --- | ---: | ---: |
| Write, median | 0.24–0.31 ms | 15.1–15.8 ms |
| Write, 99th percentile | 0.80–1.39 ms | 29.7–50.3 ms |
| Listener update, median | 0.35–0.44 ms | 15.2–16.0 ms |
| Eight writers | 8,079–11,704 writes/s | 61–63 writes/s |

Syncing every commit is right for data you cannot recreate. For emulator
data, a one-second window on a power cut is a better trade than 50 to 65
times the write latency. The official emulator writes its data only when it
exports, so a crash loses everything since the last export. That is also why
Firenook wrote more to the disk in the benchmark: 1.97 GB against 1.24 GB
over the two hours.

## Indexes on the write path

Each write keeps three indexes. The collection and collection-group indexes
take one entry each. The equality field index takes one for every top-level
field with a scalar value, keyed by collection, field and value. On an
update, the commit reads the document's current entries in the same
transaction and writes only the difference. Arrays, maps and vectors are not
indexed, and keys longer than 64 bytes become a 16-byte SHA-256 prefix.

That is a few small B-tree inserts per write. In the laptop run, switching
the field index off with `FIRENOOK_FIELD_INDEXES=0` gave medians of 0.19 to
0.31 ms, within the noise of the default's; those documents had four fields.
The index pays off on reads: an `==` or `in` filter reads only the documents
holding the value, so in the benchmark an equality filter on a string field
took 31.7 ms against 127 ms.

## Memory that does not grow with the data

Firenook keeps documents in redb on disk, behind a page cache with a 64 MiB
budget. After a commit, the store's in-memory map of documents is empty
again; what stays is the revision, recent commit times and the bounded change
log. Over the two hours, Firenook's process went from 1.77 GiB to 1.83 GiB.
The official emulator, which keeps all its data in its Java heap, went from
14.12 GiB to 19.14 GiB, and used 1,597 s of CPU time against Firenook's
625 s.

What the record does not show is where the official emulator's 200 ms go. It
measures both emulators from outside, and we will not guess at the inside of
a JVM we did not profile. It does rule one explanation out: the official stack
paged to swap during the run, but its medians matched an earlier run on the
same server in which neither stack swapped.

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
after the write at the median on Firenook and 203 ms on the official
emulator. One difference showed up: the official emulator notifies a listener
about a document its filter excludes, and Firenook does not. A journey of the
application that waited on such a notification ran longer on Firenook; it is
not an emulator latency, and the benchmark leaves it out.

## Where the official emulator is faster

The official emulator answered 6 of the 26 query shapes faster:

| Shape | Official p50 | Firenook p50 |
| --- | ---: | ---: |
| orderBy a timestamp, descending, limit 20 | 96.0 ms | 201 ms |
| orderBy an integer field, limit 20 | 94.4 ms | 178 ms |
| Range on an integer field, limit 20 | 94.2 ms | 172 ms |
| Five cursor pages of 20 | 480 ms | 888 ms |
| Batch get of 50 documents | 72.8 ms | 130 ms |
| `==` plus orderBy on another field | 98.9 ms | 109 ms |

A query that orders or range-filters reads every document in its scope,
10,918 here. Firenook's scans read single fields instead of decoding whole
documents, but they still copy every candidate's bytes out of redb, and there
is no ordered or range index yet. Those indexes are next on the roadmap, and
every index is entries a write has to keep, so the write path will be measured
again when they land. The record does not break the batch get down; at the
99th percentile, Firenook's was the faster, 172 ms against 276 ms.

## How it was measured

One AMD Ryzen 5 3600 server with 64 GiB and NVMe storage, on Ubuntu 24.04 and
Node 24.20.0, ran one emulator at a time from a clean start, with nothing
else running: firebase-tools 15.22.0 on Java 26 with its default settings,
then Firenook 0.2.0-next.6 with its defaults. Both had the same data, the
same application revision and the same workload, and the run fails unless
both end with identical data. An independent audit recomputed every figure
from the raw samples.

The numbers are kept in
[`benchmarks/next6-paired-acceptance.json`](https://github.com/firenook-dev/firenook/blob/main/benchmarks/next6-paired-acceptance.json),
and [the benchmarks page](/benchmarks) has the method and its limits. It is
one server and one application, so measure your own workload. 0.2.0-next.7
was checked against 0.2.0-next.6 on the same server, with a write median of
0.76 ms against 0.72 ms, and 0.2.0-next.8 changed no write path.

To use these write semantics for your own data, read
[Keep data between runs](/docs/data/keep-data).
