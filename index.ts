import { request } from "https"
import { parse as parseURL } from "url"
import { Parser, DomHandler, DomUtils } from "htmlparser2"

const { findAll, isText } = DomUtils

const url = "https://www.hackmud.com/forums/general_discussion/swan_lock_idea"
const { hostname, path } = parseURL(url)

const handler = new DomHandler((error, dom) => {
	if (error)
		throw error

	findAll(node => {
		const {
			["data-users"]: users,
			["data-title"]: title,
			class: class_
		} = node.attribs

		if (users)
			console.log("users:", JSON.parse(users).map(({ text }: { text: string }) => text))

		if (title)
			console.log("title:", title)

		if (class_ == "text top" && node.firstChild && isText(node.firstChild))
			console.log("message:", node.firstChild.data)

		return true
	}, dom)
})

const parser = new Parser(handler)

interface Message {
	id: string
	username: string
	time: Date
	text: string
}

interface Post {
	votes: number
	messages: Message[]
}

interface Board {
	posts: Post[]
}

interface Forum {
	boards: Board[]
}

request({
	method: "GET",
	hostname,
	path,
	headers: {
		Cookie: "_session_id=NOPE"
	}
}, res => res
	.on("data", (chunk: Buffer) => parser.write(chunk.toString()))
	.on("end", () => parser.end())
).end()

function get(url: string) {
	const { hostname, path } = parseURL(url)
	let data = ""

	return new Promise<string>((resolve, reject) => {
		request({
			method: "GET",
			hostname,
			path,
			headers: {
				"Content-Type": "application/json"
			}
		}, res => res
			.on("data", (chunk: Buffer) => data += chunk.toString())
			.on("end", () => resolve(data))
		).end()
	})
}

function isRecord(value: any): value is Record<string, unknown> {
	return !!value && typeof value == "object"
}
