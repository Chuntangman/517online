const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/imageController');

// 获取所有图片
router.get('/', ImageController.getAllImages);

// 获取主页图片
router.get('/homepage', ImageController.getHomepageImages);

// 获取单个图片
router.get('/:id', ImageController.getImageById);

// 创建新图片
router.post('/', ImageController.createImage);

// 更新图片
router.put('/:id', ImageController.updateImage);

// 删除图片
router.delete('/:id', ImageController.deleteImage);

module.exports = router;
