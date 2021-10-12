const moment = require('moment');
const config = require('config');
const helper = require('../public/javascripts/controllers/profileHelperFunctions')
const HELPER_CONST = require('../public/javascripts/controllers/profileHelperConstants')

exports.month_year_profile_list = function(req, res, next) {
    req.checkQuery('month', 'month should be specified.').notEmpty();
    req.checkQuery('year', 'year should be specified.').notEmpty();
    req.checkQuery('year', 'year should be four digit number.').isNumeric();
    req.checkQuery('month', 'month should be two digit number.').isNumeric();
    req.sanitize('month').escape();
    req.sanitize('month').trim();
    req.sanitize('year').escape();
    req.sanitize('year').trim();

    const year = JSON.parse(req.params.year);
    const month = JSON.parse(req.params.month);
    const startDate = moment.utc(year + '-' + month + '-' + 01,'YYYY-MM-DD');
    const endDate = startDate.clone().endOf('month');
    const query = Profile.aggregate([
        {$match:  {date: {$lte: endDate.toDate(), $gte: startDate.toDate()}}},
        {$project: HELPER_CONST.MONTH_YEAR_AGGREGATE},
    ]);
    const promise = query.exec();
    promise.then(function (profiles) {
        res.json(profiles);
    })
    .catch(function(err) { return next(err)});
}

exports.global_map_profiles = function(req,res, next) {
    const startDate = moment.utc(req.params.startDate)
    const endDate= moment.utc(req.params.endDate)

    const dateDiff = endDate.diff(startDate)
    const hourDiff = Math.floor(moment.duration(dateDiff).asHours())
    if (hourDiff > 72) {
        throw new Error('time range exceeds 72 hours')
    }

    const query = Profile.aggregate([
        {$match:  {date: {$lte: endDate.toDate(), $gte: startDate.toDate()}}},
        {$project: HELPER_CONST.MAP_META_AGGREGATE},
    ]);
    query.exec( function (err, profiles) {
        if (err) { return next(err); }
        res.json(profiles);
    });
};
exports.last_three_days = function(req,res, next) {

    if(req.params.startDate) {
        var endDate = moment.utc(req.params.startDate, 'YYYY-MM-DD');
        var startDate= moment.utc(req.params.startDate, 'YYYY-MM-DD').subtract(3, 'days')
    }
    else {
        const ENV = config.util.getEnv('NODE_ENV');
        const appStartDate = config.startDate[ENV];
        if (appStartDate === 'today'){
            var startDate = moment.utc().subtract(3, 'days');
            var endDate = moment.utc();      
        }
        else if (appStartDate === 'yesterday') {
            var startDate = moment.utc().subtract(4, 'days');
            var endDate = moment.utc().subtract(1, 'days');
        }
        else {
            var startDate = moment.utc().subtract(4, 'days');
            var endDate = moment.utc().subtract(1, 'days');
        }
    }
    const query = Profile.aggregate([
        {$match:  {date: {$lte: endDate.toDate(), $gte: startDate.toDate()}}},
        {$project: HELPER_CONST.MAP_META_AGGREGATE},
    ]);
    query.exec( function (err, profiles) {
        if (err) { return next(err); }
        res.json(profiles);
    });
};

exports.db_overview = function(req, res, next) {
    queries = [
        Profile.estimatedDocumentCount({}),
        Profile.distinct('dac'),
        Profile.find({'isDeep':true}).countDocuments(),
        Profile.find({'containsBGC':true}).countDocuments(),
        Profile.aggregate([{ $sort: { date: -1 } }, {$project: {'date_added': 1}}, { $limit : 1 }])
    ]
    
    Promise.all(queries).then( ([ numberOfProfiles, dacs, numberDeep, numberBgc, lastAdded ]) => {
        const date = lastAdded[0].date_added
        overviewData = {'numberOfProfiles': numberOfProfiles, 'dacs': dacs, 'numberDeep':numberDeep, 'numberBgc':numberBgc, 'lastAdded': date}
        res.json(overviewData);
    });
}