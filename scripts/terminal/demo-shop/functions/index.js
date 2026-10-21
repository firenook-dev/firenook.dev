const {onRequest} = require("firebase-functions/https");
const {onDocumentCreated} = require("firebase-functions/firestore");
const {onSchedule} = require("firebase-functions/scheduler");
const logger = require("firebase-functions/logger");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

exports.checkout = onRequest(async (req, res) => {
  const items = req.body?.items ?? [];
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const order = await db.collection("orders").add({items, total, createdAt: FieldValue.serverTimestamp()});
  res.status(201).json({id: order.id, total});
});

exports.sendReceipt = onDocumentCreated("orders/{orderId}", async (event) => {
  logger.info("receipt queued", {order: event.params.orderId, total: event.data.get("total")});
});

exports.stripeWebhook = onRequest(async (req, res) => {
  if (!req.get("stripe-signature")) {
    throw new Error("No signatures found matching the expected signature for payload");
  }
  res.sendStatus(200);
});

exports.nightlyReport = onSchedule("every day 02:00", async () => {
  logger.info("report sent");
});
