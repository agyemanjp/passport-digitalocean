/* eslint-disable camelcase */

/** Parse profile. */
export function parse(json: { html_url: string; email: any; id: string, name: string, login: string }) {
	if ('string' == typeof json) {
		json = JSON.parse(json)
	}

	const profile = {} as Profile
	profile.id = String(json.id)
	profile.displayName = json.name
	profile.username = json.login
	profile.profileUrl = json.html_url
	if (json.email) {
		profile.emails = [{ value: json.email }]
	}

	return profile
}

export type Profile = {
	provider: `digitalocean`;

	/** the user's DO ID */
	id: string;

	/** the user's full name */
	displayName: string;

	/** the user's email addresses */
	emails: { value: string }[];

	username: string

	profileUrl: string

	/*
	digitalocean: {
		beta: any;
		verified: any;
		default_organization?: string
	};
	*/

	_raw?: string | Buffer;
	_json: any;
}
