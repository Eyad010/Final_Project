const Post = require("../models/postModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const fs = require("fs");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} = require("../utils/cloudinary");
const uploadImages = require("../controllers/imagesUploadController");

exports.getLatestPosts = catchAsync(async (req, res, next) => {
  const limit = 10; // Number of posts to retrieve
  const sortQuery = { createdAt: -1 }; // Sort by createdAt field in descending order

  const posts = await Post.find().limit(limit).sort(sortQuery);

  res.status(200).json({
    status: "success",
    results: posts.length,
    data: {
      posts,
    },
  });
});

exports.getAllPosts = catchAsync(async (req, res, next) => {
  const posts = await Post.find();

  res.status(200).json({
    status: "success",
    results: posts.length,
    data: {
      posts,
    },
  });
});

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = Post.schema.path("category").enumValues;

  console.log(categories);
  res.status(200).json({
    status: "success",
    data: {
      categories,
    },
  });
});

exports.getPostsByCategory = catchAsync(async (req, res, next) => {
  const category = req.params.category;

  // Check if the category is valid (exists in the enum)
  const validCategories = Post.schema.path("category").enumValues;

  if (!validCategories.includes(category)) {
    return next(new AppError("Invalid category", 400));
  }

  // Query the database for posts with the specified category
  const posts = await Post.find({ category });

  // If no posts are found, you might want to handle this accordingly
  if (!posts || posts.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No posts found for the specified category",
      data: null,
    });
  }

  // If posts are found, send them in the response
  res.status(200).json({
    status: "success",
    results: posts.length,
    data: {
      posts,
    },
  });
});

// Get single post by ID
exports.getPost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new AppError("No post found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      post,
    },
  });
});

exports.createPost = catchAsync(async (req, res, next) => {
  // Create a new post without populating the user field
  req.body.user = req.user.id;
  const newPost = await Post.create(req.body);

  // Populate the user field in the newly created post
  const populatedPost = await Post.findById(newPost._id).populate("user");
  // console.log("New Post ID:", newPost._id);
  // console.log("Populated User:", populatedPost.user);
  res.status(201).json({
    status: "success",
    data: {
      post: populatedPost,
    },
  });
});

exports.updatePost = catchAsync(async (req, res, next) => {
  // Check if the post exists
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new AppError("No post found with that ID", 404));
  }
  // Check if the authenticated user owns the post
  if (req.user.id !== post.user.id) {
    return next(
      new AppError("You do not have permission to edit this post", 403)
    );
  }
  // Update the post
  const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      post: updatedPost,
    },
  });
});

exports.deletePost = catchAsync(async (req, res, next) => {
  // Check if the post exists
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new AppError("No post found with that ID", 404));
  }
  // Check if the authenticated user owns the post
  if (req.user.id !== post.user.id) {
    return next(
      new AppError("You do not have permission to delete this post", 403)
    );
  }

  // Remove images from Cloudinary
  for (const image of post.images) {
    await cloudinaryRemoveImage(image.publicId);
  }
  // Delete the post
  await Post.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    post: null,
  });
});

exports.searchPostsByContent = catchAsync(async (req, res, next) => {
  const query = req.params.query; // Retrieve the search query from route parameters

  // Perform search using a regex pattern to match the query in the content field
  const posts = await Post.find({
    content: { $regex: query, $options: "i" },
  });

  res.status(200).json({
    status: "success",
    results: posts.length,
    data: {
      posts,
    },
  });
});

exports.uploadPostImages = uploadImages.fields([
  { name: "images", maxCount: 3 },
]);

exports.resizePostImages = catchAsync(async (req, res, next) => {
  // 1. Check if images were uploaded
  if (!req.files.images) {
    // If no images are provided, simply skip the image update process
    return next();
  }
  // Initialize array to store image data
  req.body.images = [];

  // Upload each image to Cloudinary and process asynchronously
  await Promise.all(
    req.files.images.map(async (file, i) => {
      // Upload image to Cloudinary
      const result = await cloudinaryUploadImage(file.path);

      // Construct image data object with URL and public ID
      const imageData = {
        url: result.secure_url,
        publicId: result.public_id,
      };

      // Store image data in array
      req.body.images.push(imageData);

      // Remove uploaded file from server
      fs.unlinkSync(file.path);
    })
  );

  // Move to next middleware
  next();
});
