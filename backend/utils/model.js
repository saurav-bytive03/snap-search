import mongoose from "mongoose"

const imageSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
}, {
    timestamps: true
})

const ImageModel = mongoose.model('image', imageSchema)

export default ImageModel