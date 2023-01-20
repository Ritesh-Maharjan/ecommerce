const asyncHandler = require("express-async-handler");
const Order = require("../model/Order");
require("dotenv").config();
const Product = require("../model/Product");
const ErrorHandler = require("../utils/ErrorHandler");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

// Create Order
const createOrder = asyncHandler(async (req, res, next) => {
  const { shippingInfo, orderItems, paymentInfo, shippingPrice, totalPrice } =
    req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    shippingPrice,
    totalPrice,
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    order,
  });
});

// Get all Order
const getAllOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.find({ user: req.user._id });

  if (!order) {
    return next(new ErrorHandler("No order found", 404));
  }
  res.status(200).json({
    success: true,
    order,
  });
});

// Get single Order
const getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler("No order found", 404));
  }
  res.status(200).json({
    success: true,
    order,
  });
});

// Get all orders admin
const getAllOrderAdmin = asyncHandler(async (req, res, next) => {
  const order = await Order.find();

  let totalAmount = 0;

  order.forEach((el) => {
    totalAmount += el.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    order,
  });
});

// Update order status
const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("No Order found with that Id", 404));
  }

  if (req.body.status === "Shipped") {
    order.orderItems.forEach(async (el) => {
      await updateStock(el.product, el.quanity);
    });
  }
  order.orderStatus = req.body.status;
  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

async function updateStock(id, quanity) {
  const product = await Product.findById(id);

  product.stock -= quanity;

  await product.save({ validateBeforeSave: false });
}

// Delete order

const deleteOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order)
    return next(new ErrorHandler("Order not found with the provided id", 404));

  await order.remove();

  res.status(200).json({
    success: true,
  });
});

const payment = asyncHandler(async (req, res, next) => {
  const testing = await Promise.all(
    req.body.map(async (item) => {
      const storeItem = await Product.findById(item.product);
      return {
        price_data: {
          currency: "cad",
          product_data: {
            name: storeItem.name,
          },
          unit_amount: storeItem.price * 100,
        },
        quantity: item.quantity,
      };
    })
  );

  const session = await stripe.checkout.sessions.create({
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 500, currency: "cad" },
          display_name: "Free shipping",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 5 },
            maximum: { unit: "business_day", value: 7 },
          },
        },
      },
    ],
    line_items: testing,
    mode: "payment",
    success_url: `http://localhost:3000/orders`,
    cancel_url: `http://localhost:3000/cancel.html`,
  });
  res.status(200).json({
    success: true,
    data: {
      id: session.id,
      status: session.status,
      url: session.url
    },
  });
});

module.exports = {
  createOrder,
  getAllOrder,
  getOrder,
  getAllOrderAdmin,
  updateOrderStatus,
  deleteOrder,
  payment,
};
