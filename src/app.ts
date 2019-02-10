import * as express from 'express';
import * as mongoose from 'mongoose';
import * as crypto from 'crypto';
import * as cors from 'cors';
import {userMongo, userJoi, UserI, signinJoi, teamJoi, teamMongo, assignJoi} from './mongo';
import * as joi from 'joi';
import * as bcrypt from 'bcrypt';

// Bcrypt config
const saltRounds: number = 10;

// Mongoose shit
mongoose.connect('mongodb://localhost:27017/NoomyToornament', {useNewUrlParser: true});

// Express shit
const app: express.Application = express();
app.use(express.json());
app.use(cors());

const port = 3000;

app.get('/', (req: any, res: any) => res.send('Kestufoulatoi ?!'));

app.post('/signup', signup);
app.post('/signin', signin);
app.get('/myteam', getMyTeam);
app.post('/team', admin, createTeam);
app.post('/assign', admin, assignToTeam);
app.get('/getTeam/:id', getTeam);
app.get('/check', check);
app.get('/me', me);
app.get('/admin', admin);
app.get('/registered', admin, registered);
app.get('/logout', logout);

app.listen(port, () => console.log(`Toornament Noomy API Is Started`));

function signup(req: express.Request, res: express.Response) {
    joi.validate(req.body, userJoi, (err, value) => {
        if (err === null) {
            if (req.body.password == req.body.password_repeat) {
                const newUser = new userMongo({
                    email: req.body.email,
                    password: bcrypt.hashSync(req.body.password, saltRounds),
                    nom: req.body.nom,
                    prenom: req.body.prenom,
                    age: req.body.age,
                    pseudo: req.body.pseudo,
                    rang: req.body.rang,
                    steamlink: req.body.steamlink,
                    status: false,
                });
                newUser.save()
                    .then(() => {
                        res.status(201).json({sattus: 'created user'});
                    })
                    .catch((error: any) => {
                        res.status(400).json({error: 'Bad Request MONGO'});
                    });
            } else {
                res.status(400).json({error: 'Password mismatch'});
            }
        } else {
            console.log(err);
            res.status(400).json({error: 'Bad Request JOI'});
        }
    });
}

function signin(req: express.Request, res: express.Response) {
    joi.validate(req.body, signinJoi, (err, value) => {
        if (err === null) {
            const randomToken = crypto.randomBytes(20).toString('hex');
            userMongo.findOneAndUpdate({email: req.body.email}, {$set: {token: randomToken}})
                .then((datas: any) => {
                    if (bcrypt.compareSync(req.body.password, datas.password)) {
                        res.status(200).json({token: randomToken});
                    } else {
                        res.status(400).json({error: 'Bad Password'});
                    }
                })
                .catch((error: any) => {
                    res.status(400).json({error: 'ERROR MONGO SIGNIN'});
                });
        } else {
            res.status(400).json({error: 'Login problem'});
        }
    });
}

function check(req: express.Request, res: express.Response) {
    if (req.header('token') != undefined) {
        userMongo.findOne({token: req.header('token')})
            .then((datas: any) => {
                if (datas.token == req.header('token')) {
                    res.status(200).json({status: 'checked'});
                } else {
                    res.status(403).json({error: 'You shall not pass'});
                }
            })
            .catch((err) => {
                res.status(403).json({error: 'You shall not pass'});
            });
    } else {
        res.status(403).json({heyToi: 'ntm ?'});
    }
}

function me(req: express.Request, res: express.Response) {
    if (req.header('token') != undefined) {
        userMongo.findOne({token: req.header('token')})
            .then((datas: any) => {
                res.status(200).json(datas);
            })
            .catch((err) => {
                res.status(500).json({error: 'uejavoucpab1'});
            });
    }
}

function registered(req: express.Request, res: express.Response) {
    if (req.header('token') != undefined) {
        userMongo.findOne({token: req.header('token')})
            .then((user: any): any => {
                if (user.isAdmin == true) {
                    return userMongo.find({}).populate('team').select('-password -token').exec();
                } else {
                    res.status(403).json({ntm: 'ntm'});
                }
            })
            .then((collection: any) => {
                res.status(200).json(collection);
            })
            .catch((err: any) => {
                res.json(err);
            });
    }
}

function logout(req: express.Request, res: express.Response) {
    if (req.header('token') != undefined) {
        const randomToken = crypto.randomBytes(20).toString('hex');
        userMongo.findOneAndUpdate({token: req.header('token')}, {$set: {token: randomToken}})
            .then((datas: any) => {
                res.status(202).json({user: logout});
            })
            .catch((err: any) => {
                res.status(400).json({error: 'ERROR MONGO SIGNIN'});
            });
    }
}

function admin(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.header('token') != undefined) {
        userMongo.findOne({token: req.header('token')})
            .then((user: any) => {
                console.log(req.route);
                if (user.isAdmin) {
                    if (req.route.path != '/admin') {
                        next();
                    } else {
                        res.status(200).json({sucess: 'YOU ARE ADMIN BRUH'});
                    }
                } else {
                    res.status(403).json({status: 'Unauthorized'});
                }
            })
            .catch((err) => {
                res.status(403).json({status: 'Unauthorized'});
            });
    } else {
        res.status(403).json({status: 'Unauthorized'});
    }
}

function getMyTeam(req: express.Request, res: express.Response) {
    if (req.header('token') != undefined) {
        userMongo.findOne({token: req.header('token')})
            .populate({path: 'team',
            populate: {
                path: 'players',
                model: 'User',
                select: { password: 0, token: 0, email: 0},
            }}).select('-password -token -_id')
            .then((datas) => {
                res.status(200).json(datas);
            })
            .catch((err) => {
                console.log(err);
            });
    }
}

function createTeam(req: express.Request, res: express.Response) {
    joi.validate(req.body, teamJoi, (err, value) => {
        if (err === null) {
            const newTeam = new teamMongo({
                teamName: req.body.teamName,
                players: [],
            });
            newTeam.save()
                .then((object: any) => {
                    res.status(201).json(object);
                })
                .catch((error) => {
                    res.status(400).json({error: 'mongo problem'});
                });
        } else {
            res.status(400).json({error: 'bad request'});
        }
    });
}

function getTeam(req: express.Request, res: express.Response) {
    if (req.header('token') != undefined) {
        if (req.params.id !== 'all') {
            teamMongo.findOne({_id: req.params.id})
                .populate('players', 'pseudo')
                .then((datas) => {
                    res.status(200).json(datas);
                })
                .catch((err) => {
                    console.log(err);
                });
        } else {
            teamMongo.find({})
                .then((datas) => {
                    res.status(200).json(datas);
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }
}

function assignToTeam(req: express.Request, res: express.Response) {
    joi.validate(req.body, assignJoi, (err, value) => {
        if (err === null) {
            userMongo.findOne({token: req.header('token')})
                .then((user: any) => {
                    return teamMongo.findOneAndUpdate({_id: user.team}, {$pull: {players: req.body.playerId}}).exec();
                })
                .then((result) => {
                    return teamMongo.findOneAndUpdate({_id: req.body.teamId}, {$push: {players: req.body.playerId}}).exec();
                })
                .then((result) => {
                    return userMongo.findOneAndUpdate({_id: req.body.playerId}, {$set: {team: req.body.teamId}}).exec();
                })
                .then(() => {
                    res.status(200).json({success: 'yiiiiisssss'});
                })
                .catch((error: any) => {
                    console.log(error);
                });
        }
    });
}
