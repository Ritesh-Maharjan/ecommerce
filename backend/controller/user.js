const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("../model/User");
const Product = require("../model/Product");
const ErrorHandler = require("../utils/ErrorHandler");
const sendToken = require("../utils/jwtToken");
const sendMail = require("../utils/sendMail");

// create User
const createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // creating the user
  const user = await User.create({
    name,
    email,
    password,
  });

  // to redirect customer back to the webpage instead of them having to login
  sendToken(user, 201, res);
});

// Login the user
const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //   checking if email and password was provided or not
  if (!email || !password) {
    return next(
      new ErrorHandler("Please provide your username and email"),
      400
    );
  }

  // checking whether the user exists with that email and selecting the password
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(
      new ErrorHandler("User is not found with this email and password", 401)
    );
  }

  //   compare password with existing user
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched)
    return next(
      new ErrorHandler("User is not found with this email and password", 401)
    );

  sendToken(user, 200, res);
});

// Get User Details
const getUser = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const user = await User.findById(id);

  res.status(200).json({
    success: true,
    user,
  });
});

// Update User Email
const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const { email } = req.body;

  await User.findByIdAndUpdate(
    id,
    {
      email,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    sucess: true,
  });
});

// Update User password
const updateUserPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(id).select("+password");

  if (newPassword !== confirmPassword) {
    return next(
      new ErrorHandler(
        "New password and confirm password is not same, please double check",
        400
      )
    );
  }

  //   compare password with existing user
  const isPasswordMatched = await user.comparePassword(oldPassword);

  if (!isPasswordMatched)
    return next(new ErrorHandler("Incorrect old password", 401));

  user.password = newPassword;
  await user.save();

  sendToken(user, 200, res);
});

// Delete user
const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.user;

  await User.findByIdAndDelete(id);

  // Delete all the reviews made by this user
  const reviewedProduct = await Product.find({ "reviews.user": id });

  // checking if there is any reviews made by the user
  if (reviewedProduct.length > 0) {
    // going through all the reviews in different products and removing the comments and changing the totalRatings and rating also
    reviewedProduct.forEach((product) => {
      const updatedReviews = product.reviews.filter((el) => {
        return el.user.toString() !== id;
      });

      product.reviews = updatedReviews;
      product.numOfReviews -= 1;
      let totalRatings = 0;
      product.reviews.map((el) => {
        totalRatings += el.rating;
      });
      if (product.numOfReviews > 0) {
        product.ratings = totalRatings / product.numOfReviews;
      } else {
        product.ratings = 0;
      }
      product.save();
    });
  }

  res.status(200).json({
    sucess: true,
  });
});

// Reset password email
const resetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(
      new ErrorHandler("No user exists with the provided email", 404)
    );
  }

  // get the reset token
  const resetToken = user.getResetToken();

  await user.save({
    validateBeforeSave: false,
  });

  // creating url to reset token for our page
  const resetPassowrdUrl = `${process.env.CLIENT_URL}/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPassowrdUrl}`;

  try {
    await sendMail({
      email: user.email,
      subject: `Password recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email has been sent to ${user.email} to reset your password successfully`,
    });
  } catch (error) {
    // need to modify the resetPasswordToken and resetPasswordTime since we already saved earlier
    user.resetPasswordToken = undefined;
    user.resetPasswordTime = undefined;

    await user.save({
      validateBeforeSave: false,
    });
    return next(new ErrorHandler(error.message));
  }
});

// Reset password change
const changeForgetPassword = asyncHandler(async (req, res, next) => {
  // create token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTime: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Reset password token has expired", 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler(
        "Password and confirm password is not same, please double check",
        400
      )
    );
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTime = undefined;

  await user.save();

  sendToken(user, 200, res);
});

module.exports = {
  createUser,
  loginUser,
  getUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  resetPassword,
  changeForgetPassword,
};
