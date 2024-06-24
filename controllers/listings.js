const express = require('express');
const router = express.Router();

const Listing = require('../models/listing');

// prefix of /listings added in server.js
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

router.get('/new', (req, res) => {
    res.render('listings/new.ejs');
});

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

router.post('/', async (req, res) => {
    try {
        req.body.owner = req.session.user._id;
        await Listing.create(req.body);
    } catch (error) {
        console.log(error);
    }
    res.redirect('/listings');
});

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

module.exports = router;
