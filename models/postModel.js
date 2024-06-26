const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, "Provide a content of post !"],
  },
  images: [
    {
      publicId: String,
      url: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  location: {
    type: String,
    required: [true, "location must be provided"],
  },
  category: {
    type: String,
    enum: [
      "أخري",
      "أدوات تعليمية",
      "إكسسوارت",
      "ترفيه و تسلية",
      "كتب",
      "شنط و أحذية",
      "ديكور وأثاث",
      "أحذية",
      "أجهزة منزلية",
      "أدوات رياضية",
      "ملابس",
    ],
    required: true,
  },
  price: {
    type: Number,
    default: 0,
  },
});

postSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo phone",
  });
  next();
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
