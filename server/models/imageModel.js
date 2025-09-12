const { Pool } = require('pg');
const pool = require('../config/database');

class ImageModel {
    // 获取所有图片
    static async getAllImages() {
        const query = 'SELECT * FROM public."517image" ORDER BY id ASC';
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // 根据ID获取单个图片
    static async getImageById(id) {
        const query = 'SELECT * FROM public."517image" WHERE id = $1';
        try {
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 获取主页图片（图片名为"主页图1"、"主页图2"、"主页图3"、"主页图4"）
    static async getHomepageImages() {
        const query = `
            SELECT * FROM public."517image" 
            WHERE "图片名" IN ('牧场', '殿堂', '海岸', '列车')
            ORDER BY "图片名" ASC
        `;
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // 根据图片名获取图片（用于驿站图片展示）
    static async getImagesByName(imageName) {
        const query = `
            SELECT * FROM public."517image" 
            WHERE "图片名" = $1
            ORDER BY id ASC
        `;
        try {
            const result = await pool.query(query, [imageName]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // 创建新图片记录
    static async createImage(imageData) {
        const query = `
            INSERT INTO public."517image" (id, "图片名", "介绍", "存储（根目录路径）", "二进制转码")
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        try {
            const values = [
                imageData.id,
                imageData.imageName,
                imageData.description,
                imageData.storagePath,
                imageData.binaryCode
            ];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 更新图片信息
    static async updateImage(id, imageData) {
        const query = `
            UPDATE public."517image"
            SET "图片名" = $2,
                "介绍" = $3,
                "存储（根目录路径）" = $4,
                "二进制转码" = $5
            WHERE id = $1
            RETURNING *
        `;
        try {
            const values = [
                id,
                imageData.imageName,
                imageData.description,
                imageData.storagePath,
                imageData.binaryCode
            ];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 删除图片
    static async deleteImage(id) {
        const query = 'DELETE FROM public."517image" WHERE id = $1 RETURNING *';
        try {
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ImageModel;
