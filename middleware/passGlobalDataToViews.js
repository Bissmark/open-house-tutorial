const passGlobalDataToViews = (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.title = 'Open House';
    next();
};

module.exports = passGlobalDataToViews;