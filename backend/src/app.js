const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(cors());
app.use("/api/webhooks/razorpay", express.raw({ type: "application/json" }));
app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/test", require("./routes/test.routes"));
app.use("/api/donations", require("./routes/donation.routes"));
app.use("/api/webhooks", require("./routes/webhook.routes"));
app.use("/api/contact", require("./routes/contact.routes"));
// app.use("/api/products", require("./routes/product.routes"));
// app.use("/api/orders", require("./routes/order.routes"));

module.exports = app;
