const express = require('express');
const router = express.Router();
const cloudinary = require('../middleware/cloudinary');
const upload = require('../middleware/multer');

const Listing = require('../models/listing');

// INDEX
router.get('/', async (req, res) => {
    try {
        const listings = await Listing.find({}).populate('owner');
        console.log(listings); // []

        res.render('listings/index.ejs', {
            listings: listings,
        });
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
});

// NEW
router.get('/new', (req, res) => {
    res.render('listings/new.ejs');
});

// SHOW
router.get('/:id', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).populate('owner');

        const alreadyFavorited = listing.favoritedByUsers.some((userId) => userId.equals(req.session.user._id));
        
        res.render('listings/show.ejs', {
            listing: listing,
            alreadyFavorited: alreadyFavorited
        });
    } catch (error) {
        console.log(error);
        res.redirect('/listings');
    }
});

// CREATE
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const imageResult = await cloudinary.uploader.upload(req.file.path);

        req.body.owner = req.session.user._id;
        req.body.images = imageResult.secure_url;
        req.body.cloudinary_id = imageResult.public_id;

        await Listing.create(req.body);
    } catch (error) {
        console.log(error);
    }
    res.redirect('/listings');
});

// EDIT
router.get('/:id/edit', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        res.render('listings/edit.ejs', {
            listing: listing
        });
    } catch (error) {
        console.log(error);
        res.redirect('/listings');
    }
});

router.put('/:id', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (listing.owner.equals(req.session.user._id)) {
            await listing.updateOne(req.body);
        }
        res.redirect('/listings/' + listing._id); // GET show
    } catch (error) {
        console.log(error);
        res.redirect('/listings');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (listing.owner.equals(req.session.user._id)) {
            await listing.deleteOne();
        }
    } catch (error) {
        console.log(error);
    }
    res.redirect('/listings');
});

router.post('/:id/favorite', async (req, res) => {
    try {
        await Listing.findByIdAndUpdate(req.params.id, {
            $push: { favoritedByUsers: req.session.user._id }
        });
    } catch (error) {
        console.log(error);
    }
    res.redirect('/listings/' + req.params.id);
});

router.delete('/:id/favorites', async (req, res) => {
    try {
        await Listing.findByIdAndUpdate(req.params.id, {
            $pull: { favoritedByUsers: req.session.user._id }
        });
    } catch (error) {
        console.log(error);
    }
    res.redirect('/listings/' + req.params.id);
})

router.post('/:id/images', upload.array('image', 6), async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        const imagesUrls = [];
        const cloudinaryIds = [];

        for (const file of req.files) {
            const imageResult = await cloudinary.uploader.upload(file.path);
            imagesUrls.push(imageResult.secure_url);
            cloudinaryIds.push(imageResult.public_id);
        }

        if (listing) {
            await Listing.findByIdAndUpdate(req.params.id, {
                $push: {
                    images: { $each: imagesUrls },
                    cloudinary_id: { $each: cloudinaryIds }
                }
            });
        };

    } catch(error) {
        console.log(error);
    }
    res.redirect('/listings/' + req.params.id);
})

module.exports = router;
