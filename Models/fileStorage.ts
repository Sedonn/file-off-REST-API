import mongoose from 'mongoose';
import streamifier from 'streamifier';

import { ObjectId as BSONObjectId } from 'bson';
import { FileMetadata } from '../@types/file-off';
import { Types } from 'mongoose';

class FileStorage {
    private readonly _COLLECTION_NAME: string = 'fs.files';

    private _db;
    private _bucket;
    private _collection;

    constructor() {
        this._db = mongoose.connection.db;
        this._bucket = new mongoose.mongo.GridFSBucket(this._db);
        this._collection = this._db.collection(this._COLLECTION_NAME);
    }

    public writeFile(file: Express.Multer.File, metadata: FileMetadata) {
        return streamifier.createReadStream(file.buffer).pipe(this._bucket.openUploadStream(file.originalname, { metadata }));
    }

    public async getFileByReceiver(receiverId: Types.ObjectId, filename: string) {
        return this._collection.findOne({
            $and: [{ filename: filename }, { 'metadata.receiverId': receiverId }],
        });
    }

    public async getFileBySender(senderId: Types.ObjectId, filename: string) {
        return this._collection.findOne({
            $and: [{ filename: filename }, { 'metadata.senderId': senderId }],
        });
    }

    public getFileDownloadStream(fileId: BSONObjectId) {
        return this._bucket.openDownloadStream(fileId);
    }

    public async getUploadData(fileId: BSONObjectId) {
        return this._collection
            .aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'metadata.receiverId',
                        foreignField: '_id',
                        as: 'receiverData',
                    },
                },
                {
                    $match: { _id: fileId },
                },
                {
                    $project: {
                        _id: 0,
                        uploadDate: 1,
                        filename: 1,
                        'receiverData.login': 1,
                    },
                },
                {
                    $limit: 1,
                },
            ])
            .next();
    }

    public async getUploadFiles(userId: Types.ObjectId) {
        return mongoose.connection.db
            .collection('fs.files')
            .aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'metadata.receiverId',
                        foreignField: '_id',
                        as: 'receiverData',
                    },
                },
                {
                    $match: { 'metadata.senderId': userId },
                },
                {
                    $project: {
                        _id: 0,
                        uploadDate: 1,
                        filename: 1,
                        'receiverData.login': 1,
                    },
                },
            ])
            .toArray();
    }

    public async getDownloadFiles(userId: Types.ObjectId) {
        return mongoose.connection.db
            .collection('fs.files')
            .aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'metadata.senderId',
                        foreignField: '_id',
                        as: 'senderData',
                    },
                },
                {
                    $match: { 'metadata.receiverId': userId },
                },
                {
                    $project: {
                        _id: 0,
                        uploadDate: 1,
                        filename: 1,
                        'senderData.login': 1,
                    },
                },
            ])
            .toArray();
    }

    public async deleteFile(fileId: BSONObjectId) {
        return this._bucket.delete(fileId);
    }
}

export default FileStorage;