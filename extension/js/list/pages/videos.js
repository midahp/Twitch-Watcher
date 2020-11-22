import { h, Component, render, createRef } from '../../lib/preact.module.js';
import htm from '../../lib/htm.module.js';
import {route} from '../../lib/preact-router.js';

import {utils} from '../../utils/utils.js';

import {dataFormater} from '../format.js';

import {v5Api, clipsEndpoint} from '../../api/twitch/v5.js';
import {HelixEndpoint, helixApi} from '../../api/twitch/helix.js';
import {GqlEndpoint} from '../../api/twitch/graphql.js';

import {FavouriteIcon} from '../favs.js';
import {watchLater} from '../watchlater.js';





const html = htm.bind(h);

