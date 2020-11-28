import { request } from "https"
import { parse as parseURL } from "url"
import { Parser, DomHandler, DomUtils } from "htmlparser2"

const { findAll, isText } = DomUtils

const hostname = "https://www.hackmud.com/"

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

getForum()

function page(path: string, callback: Parameters<typeof findAll>[0]) {
	return new Promise((resolve, reject) => {
		const parser = new Parser(new DomHandler((error, dom) => {
			if (error)
				reject(error)

			resolve(findAll(callback, dom))
		}))

		request({
			method: "GET",
			hostname,
			path,
			headers: {
				Cookie: "_session_id=NOPE"
			}
		}, res => res
			.on("data", (chunk: Buffer) => parser.write(chunk.toString()))
			.on("end", parser.end)
		).end()
	})
}

function getForum() {
	return new Promise((resolve, reject) => {
		const parser = new Parser(new DomHandler((error, dom) => {
			if (error)
				reject(error)

			console.log(dom)
		}))

		request({
			method: "GET",
			hostname,
			path: "forums",
			headers: {
				// Cookie: "_session_id=NOPE"
			}
		}, res => res
			.on("data", (chunk: Buffer) => parser.write(chunk.toString()))
			.on("end", parser.end)
		).end()
	})
}

function getPost(path: string) {
	const parser = new Parser(new DomHandler((error, dom) => {
		if (error)
			throw error

		findAll(node => {
			const {
				"data-users": users,
				"data-title": title,
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
	}))

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
}
