const User = require("../models/userModel");
const Post = require("../models/postModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const path = require("path");
const fs = require("fs");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} = require("../utils/cloudinary");

//filter out unwanted fields from the input object and return a new object containing only the allowed fields.
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  if (req.body.email) {
    return next(new AppError("Email cannot be changed.", 400));
  }

  if (req.file) {
    return next(
      new AppError(
        "You cannot update your profile photo from this route. Please use /updateMyProfilePhoto.",
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are allowed to be updated
  const filteredBody = filterObj(req.body, "name", "phone");

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  // console.log("Updated User:", updatedUser);

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

// retrieve the ID of the authenticated user from the req.user object and assign it to req.params.id
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getOne = catchAsync(async (req, res, next) => {
  const doc = await User.findById(req.params.id).populate({
    path: "posts",
    select: "-user",
  });

  if (!doc) return next(new AppError("No user found with that ID", 404));

  res.status(200).json({
    status: "success",
    posts: doc.posts.length,
    data: {
      data: doc,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  //Remove users posts
  await Promise.all([
    User.findByIdAndDelete(userId),
    Post.deleteMany({ user: userId }),
  ]);

  // await User.findByIdAndDelete(req.user.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getUserById = catchAsync(async (req, res, next) => {
  // Get user from params
  const id = req.params.id;
  // Check if the user exists
  const user = await User.findById(id).populate({
    path: "posts",
    select: "-user",
  });
  if (!user) {
    return next(new AppError("No user found with that ID.", 404));
  }
  res.status(200).json({
    status: "succes",
    data: {
      user,
    },
  });
});

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.profilePhotoUpload = catchAsync(async (req, res, next) => {
  // 1) validation
  if (!req.file) {
    return res.status(400).json({ message: "no file provided" });
  }

  // console.log(req.file);
  // 2) get the path to the image
  const imagePath = path.join(
    __dirname,
    `../public/img/users/${req.file.filename}`
  );
  // 3) upload to cloudinary
  const result = await cloudinaryUploadImage(imagePath);
  // console.log(result);
  // 4)get the user from DB
  const user = await User.findById(req.user.id);
  // 5) delete the old profile photo if exist
  if (user.photo.publicId !== null) {
    await cloudinaryRemoveImage(user.photo.publicId);
  }
  // 6) change the profilePhoto field in the DB
  user.photo = {
    url: result.secure_url,
    publicId: result.public_id,
  };
  user.markModified("photo"); // Mark the photo field as modified
  user.passwordConfirm = user.password; // Set passwordConfirm to match the password
  await user.save({ validateBeforeSave: false });

  //7) send response to client
  res.status(200).json({
    success: true,
    message: "your photo updated successfully",
    data: {
      user,
    },
  });
  // remove image from the server
  fs.unlinkSync(imagePath);
});
