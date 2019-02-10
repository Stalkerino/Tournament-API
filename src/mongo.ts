import { Schema, Model, model, Document } from 'mongoose';
import * as joi from 'joi';

// User Info Creation

const userSchema: Schema = new Schema({
    email: { type : String , unique : true, required : true },
    password: String,
    nom: String,
    prenom: String,
    age: Number,
    pseudo: String,
    rang: Number,
    steamlink: String,
    team: {type: Schema.Types.ObjectId, ref: 'Team'},
    isAdmin: Boolean,
    status: Boolean,
    token: String,
});

export const userMongo = model('User', userSchema, 'users');

export interface UserI {
    email: string;
    password: string;
    password_repeat: string;
    nom: string;
    prenom: string;
    age: number;
    pseudo: string;
    rang: number;
    steamlink: string;
}

export const userJoi = joi.object().keys({
    email: joi.string().required(),
    password: joi.string().required(),
    password_repeat: joi.string().required(),
    nom: joi.string().required(),
    prenom: joi.string().required(),
    age: joi.number().required(),
    pseudo: joi.string().required(),
    rang: joi.number().required(),
    steamlink: joi.string().required(),
});

// User signin

export const signinJoi = joi.object().keys({
    email: joi.string().required(),
    password: joi.string().required(),
});

// Equipes

const teamSchema: Schema = new Schema({
    teamName: {type: String, unique: true},
    players: [{type: Schema.Types.ObjectId, ref: 'User'}],
});

export const teamMongo = model('Team', teamSchema, 'teams');

export const teamJoi = joi.object().keys({
   teamName: joi.string().required(),
   players: joi.array(),
});

// Joi assign team

export const assignJoi = joi.object().keys({
    playerId: joi.string().required(),
    teamId: joi.string().required(),
});
