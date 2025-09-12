const ImageModel = require('../models/imageModel');

class ImageController {
    // 获取所有图片
    static async getAllImages(req, res, next) {
        try {
            const images = await ImageModel.getAllImages();
            res.json({
                success: true,
                data: images
            });
        } catch (error) {
            next(error);
        }
    }

    // 获取单个图片
    static async getImageById(req, res, next) {
        try {
            const { id } = req.params;
            const image = await ImageModel.getImageById(parseInt(id));
            
            if (!image) {
                return res.status(404).json({
                    success: false,
                    message: '图片不存在'
                });
            }

            res.json({
                success: true,
                data: image
            });
        } catch (error) {
            next(error);
        }
    }

    // 获取主页图片（图片名包含"主页图"的图片）
    static async getHomepageImages(req, res, next) {
        try {
            const images = await ImageModel.getHomepageImages();
            res.json({
                success: true,
                data: images
            });
        } catch (error) {
            next(error);
        }
    }

    // 根据图片名获取图片（用于驿站图片展示）
    static async getImagesByName(req, res, next) {
        try {
            const { name } = req.params;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: '图片名称不能为空'
                });
            }

            const images = await ImageModel.getImagesByName(name);
            res.json({
                success: true,
                data: images,
                count: images.length
            });
        } catch (error) {
            next(error);
        }
    }

    // 创建新图片
    static async createImage(req, res, next) {
        try {
            const imageData = {
                id: req.body.id,
                imageName: req.body.imageName,
                description: req.body.description,
                storagePath: req.body.storagePath,
                binaryCode: req.body.binaryCode
            };

            const newImage = await ImageModel.createImage(imageData);
            res.status(201).json({
                success: true,
                data: newImage
            });
        } catch (error) {
            next(error);
        }
    }

    // 更新图片
    static async updateImage(req, res, next) {
        try {
            const { id } = req.params;
            const imageData = {
                imageName: req.body.imageName,
                description: req.body.description,
                storagePath: req.body.storagePath,
                binaryCode: req.body.binaryCode
            };

            const updatedImage = await ImageModel.updateImage(parseInt(id), imageData);
            
            if (!updatedImage) {
                return res.status(404).json({
                    success: false,
                    message: '图片不存在'
                });
            }

            res.json({
                success: true,
                data: updatedImage
            });
        } catch (error) {
            next(error);
        }
    }

    // 删除图片
    static async deleteImage(req, res, next) {
        try {
            const { id } = req.params;
            const deletedImage = await ImageModel.deleteImage(parseInt(id));
            
            if (!deletedImage) {
                return res.status(404).json({
                    success: false,
                    message: '图片不存在'
                });
            }

            res.json({
                success: true,
                data: deletedImage,
                message: '图片已成功删除'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ImageController;