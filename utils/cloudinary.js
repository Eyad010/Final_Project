const cloudinary = require('cloudinary');


// cloudinary upload image
const cloudinaryUploadImage =async(fileToUpload) => {
    try{
    const data = await cloudinary.uploader.upload(fileToUpload, { 
       resource_type: 'auto' });
       return data;
    }catch(err){
        return err;
    }   
};

// cloudinary remove image
const cloudinaryRemoveImage =async(imagePublicId) => {
    try{
    const result = await cloudinary.uploader.destroy(imagePublicId);
       return result;
    }catch(err){
        return err;
    }   
};
module.exports={
   cloudinaryUploadImage,
   cloudinaryRemoveImage
};


///////////////////////////////////////

   // 4) get the user from DB 
  //  const user = await User.findById(req.user.id); 
   // 5) delete the old photo if exist
   // if(user.profilePhoto.publicId != null){
    // await cloudinaryRemoveImage(user.profilePhoto.publicId);
   //}
   // 6) change the photo field in the DB
   //   user.profilePhoto = {
   //   url: result.secure_url,
   //   publicId: result.public_id
   //};
   // await user.save();
   // 7) send the respones  with status OK and the modified user
   // res.status(200).json({
    // message: 'your profile photo uploaded',
    // profilePhoto: {url: result.secure_url, publicId: result.public_id}
   //});
   // 8) remove image from the server
   // fs.unlinkSync(imagePath)
   ////////////////////////////////////////////////




   