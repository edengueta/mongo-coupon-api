const express = require('express');
const bodyParser = require('body-parser');
const {MongoClient,ObjectId} =require('mongodb');
const moment = require('moment'); // library for the date
var cc = require('coupon-code'); // library for the code
const app = express();
const port = 4000;
let db;


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.put ('/coupon', (req, res) => {
	const code = cc.generate({ parts : 3 });
	const date = moment().format('LLL');
	const isRedeem = false;
	db.collection('coupons')
		.insertOne({ code, date, isRedeem })
		.then ((report) => res.status(201).send(report.ops[0]))
		.catch ((e) => {
			console.log(e);
			res.sendStatus(500);
		})
});


app.get ('/coupon', (req, res) => {
	db.collection('coupons')
		.find()
		.toArray()
		.then ((coupons)=>{
			res.send (coupons)
	})
})

app.get ('/coupon/:id', (req,res) => {
	db.collection('coupons')
		.findOne({_id:ObjectId(req.params.id)})
		.then ((coupon)=>{
			if (!coupon) {
				res.sendStatus(404);
				return;
			}
			res.send (coupon);
		})
})

app.delete ('/coupon/:id', (req,res) => {
	db.collection('coupons')
		.deleteOne({_id:ObjectId(req.params.id)})
		.then((report)=> {
			if (report.deletedCount ===0) {
				res.sendStatus(404);
				return;
			}
			res.sendStatus(204);
		});
});

// Set a new code and update the time.
app.post('/coupon/:id', (req, res) => {
	const date = moment().format('LLL');
	const code = cc.generate({ parts : 3 });

	db.collection('coupons')
		.updateOne(
			{_id:ObjectId(req.params.id)},
			{
				$set:{ code,
					   date: date + '(UPDATED)'
					 }
			}
		)
		.then ((report)=> {
			if (report.matchedCount ===0) {
				res.sendStatus(404);
				return;
			}
			res.sendStatus(200)
		})
});

app.post('/coupon/:id/redeem', (req, res) => {
	const date = moment().format('LLL');
	db.collection('coupons')
		.updateOne(
			{_id:ObjectId(req.params.id)},
			{ $set:{
				date: date + '(REDEEMED)',
				isRedeem: true
			  } 
			}
		)
		.then ((report)=> {
			if (report.matchedCount ===0) {
				res.sendStatus(404);
				return;
			}
			res.sendStatus(200)
		})
});


app.get ('/coupon/search/:code', (req,res) => {
	db.collection('coupons')
		.findOne({code:req.params.code})
		.then ((coupon)=>{
			if (!coupon) {
				res.sendStatus(404);
				return;
			}
			res.send (coupon);
		})
})

const client = new MongoClient('mongodb://localhost:27017',{useUnifiedTopology:true});
client.connect()
	.then(() => {
		db= client.db('coupons_app');
		console.log('Connected to DB:', db.namespace )
		app.listen(port, () => console.log(`Server listening on port ${port}!`));
	})
	.catch((e) => console.log ('Could not connect to MongoDB' , e));
	
