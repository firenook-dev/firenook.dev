// The home page's questions, also given to search engines as an FAQ.

export const homeFaqs = [
  {
    question: 'Do I still need firebase-tools?',
    answer:
      'Yes, for deploying and everything else the Firebase CLI does. Firenook replaces only the emulators: install it next to firebase-tools and run your emulators with it.',
  },
  {
    question: 'Does Firenook need Java?',
    answer:
      'No. Its services are native code in one npm package, with an engine for macOS, Linux and Windows, and nothing else is downloaded at install or start. Node runs your Functions, as it does in production.',
  },
  {
    question: 'Can I go back to the official emulator?',
    answer:
      'Yes. Firenook imports and exports the official format. While Firenook runs, export with npx firenook emulators:export ./export, then start the official emulator with --import ./export.',
  },
  {
    question: 'Which services does it emulate?',
    answer:
      'Firestore, Authentication, Cloud Storage, Cloud Functions, Extensions, Pub/Sub, Cloud Tasks and Eventarc. Realtime Database, Hosting, App Hosting and Data Connect are not emulated; a firebase.json that configures them still starts, with a warning.',
  },
  {
    question: 'Is it ready for my team?',
    answer:
      'Firenook is in preview: its releases are 0.2.0-next versions on npm. Every release passes conformance replays against the official emulator and packed installs on all five platforms. Pin an exact version and upgrade on purpose.',
  },
  {
    question: 'Is it free?',
    answer: 'Yes. Firenook is open source under the Apache License 2.0.',
  },
  {
    question: 'Is Firenook made by Google?',
    answer:
      'No. Firenook is an independent open-source project, not affiliated with or endorsed by Google. Firebase is a trademark of Google LLC.',
  },
];
