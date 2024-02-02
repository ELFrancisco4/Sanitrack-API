import {v2 as cloudinary} from 'cloudinary';

const cloudinaryConfig = {
    cloud_name: 'doiweqqmg',
    api_key: '937933468725199',
    api_secret: 'mUxsAaJaYjUa7UJdoDxyKVVI43o',
    secure: true,
};

cloudinary.config(cloudinaryConfig)
export default cloudinary