import { Strategy as PassportStrategy } from 'passport'
import { Strategy as OAuth2Strategy, StrategyOptions, InternalOAuthError } from 'passport-oauth2'
import { parse, Profile } from './profile'


/** Authenticates requests by delegating to DigitalOcean using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your DigitalOcean application's Client ID
 *   - `clientSecret`  your DigitalOcean application's Client Secret
 *   - `callbackURL`   URL to which DigitalOcean will redirect the user after granting authorization
 *   - `scope`         array of permission scopes to request.  valid scopes include:
 *                     'read', 'write', or none.
 *                     (see https://developers.digitalocean.com/oauth/#scopes for more info)
 *   — `userAgent`     All API requests MUST include a valid User Agent string.
 *                     e.g: domain name of your application.
 *                     (see http://developer.github.com/v3/#user-agent-required for more info)
 *
 * Examples:
 *
 *     passport.use(new DigitalOceanStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/digitalocean/callback',
 *         userAgent: 'myapp.com'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
export class Strategy extends OAuth2Strategy implements PassportStrategy {
	private _userProfileURL: string

	constructor(options: StrategyOptions & { userAgent?: string; userProfileURL?: string }, verify: VerifyFunction) {
		options = options || {}
		options.authorizationURL = options.authorizationURL || 'https://cloud.digitalocean.com/v1/oauth/authorize'
		options.tokenURL = options.tokenURL || 'https://cloud.digitalocean.com/v1/oauth/token'
		options.scopeSeparator = options.scopeSeparator || ','
		options.customHeaders = options.customHeaders || {}

		if (!options.customHeaders['User-Agent']) {
			options.customHeaders['User-Agent'] = options.userAgent || 'passport-digitalocean'
		}

		super(options, verify)

		this.name = 'digitalocean'
		this._userProfileURL = options.userProfileURL || 'https://api.digitalocean.com/v2/sizes'
		this._oauth2.useAuthorizationHeaderforGET(true)
	}

	name = super.name
	authenticate = super.authenticate

	/** Retrieve user profile from DigitalOcean.
	 *
	 * This function constructs a normalized profile, with the following properties:
	 *
	 *   - `provider`         always set to `digitalocean`
	 *   - `id`               the user's DigitalOcean ID
	 *   - `username`         the user's DigitalOcean username
	 *   - `displayName`      the user's full name
	 *   - `profileUrl`       the URL of the profile for the user on DigitalOcean
	 *   - `emails`           the user's email addresses
	 *
	 * @param {String} accessToken
	 * @param {Function} done
	 * @api protected
	 */
	public userProfile(accessToken: string, done: (err: Error | null, result?: Profile) => void) {
		this._oauth2.get(this._userProfileURL, accessToken, function (err, body, res) {
			let json = undefined as undefined | ArgsType<typeof parse>[0]

			if (err) {
				return done(new InternalOAuthError('Failed to fetch user profile', err))
			}

			if (!body) {
				return done(new Error('User profile fetch response empty', err))
			}

			try {
				json = JSON.parse(body.toString())
				if (!json) {
					return done(new Error('Could not parse user profile JSON', err))
				}

			}
			catch (ex) {
				return done(new Error('Failed to parse user profile'))
			}

			const profile = parse(json)
			profile.provider = 'digitalocean'
			profile._raw = body
			profile._json = json

			done(null, profile)
		})
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ArgsType<F extends (...x: any[]) => any> = F extends (...x: infer A) => any ? A : never

export type VerifyFunction = (accessToken: string, refreshToken: string, profile: any, verified: VerifyCallback) => void

type VerifyCallback = (err?: Error | null, user?: Express.User, info?: object) => void;
