const moment = require('moment');

exports.find_one = function(req, res , next) {
    const query = arShapes.findOne();
    query.exec(function (err, arShape) {
    if (err) return next(err);
    res.json(arShape);
    })
}

exports.find_by_date = function(req, res , next) {
    req.checkQuery('date', 'date should be specified.').notEmpty();
    req.sanitize('date').toDate();
    const date = req.query.date;
    const query = arShapes.find({date: date});
    query.exec(function (err, arShapes) {
        if (err) return next(err);
        res.json(arShapes);
    })
}

exports.find_by_id = function(req, res, next) {
    req.checkQuery('_id', 'id should be specified.').notEmpty();
    const shape_id = req.query._id
    const query = arShapes.find({_id: shape_id})
    query.exec(function (err, arShapes) {
        if (err) return next(err);
        res.json(arShapes);
    })
}