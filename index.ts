import { request } from "https"
import { Parser, DomHandler } from "htmlparser2"
import { isText, isTag } from "domutils"
import { assert, isTruthy, JSONValue } from "./lib"
import * as lib from "./lib"
import { Element, Node } from "domhandler"

interface Message {
	id: string
	username: string
	time: Date
	text: string
	board: Board
}

interface Post {
	title: string
	slug: string
	i: string
	votes: number
	archived: boolean
	implemented: boolean
	locked: boolean
	answered: boolean
	sticky: boolean
	unread: boolean
	admin: boolean
	vote: boolean
	messages: Message[]
	board: Board
}

interface Board {
	name: string
	slug: string
	art?: string
	posts: Post[]
}

interface Forum {
	users?: string[]
	boards: Board[]
	posts: Post[]
}

const hostname = "hackmud.com"

export function getForum(sessionID: string) {
	return new Promise((resolve, reject) => {
		const parser = new Parser(new DomHandler((error, [ ,, html ]) => {
			if (error)
				return reject(error)

			assert(html, isTruthy, isTag)

			const [ ,,, body ] = html.children

			assert(body, isTruthy, isTag)

			const [ , page ] = body.children

			assert(page, isTruthy, isTag)

			const [ , header ] = page.children

			assert(header, isTruthy, isTag)

			const [ ,,, nav,, userSelect ] = header.children

			assert(nav, isTruthy, isTag)

			const boardButtons = nav.children.slice(7)
			const boards: string[] = []

			for (let i = 0; i < boardButtons.length; i++) {
				const boardButton = boardButtons[i]

				if (!(i % 2)) {
					assert(boardButton, isTag)

					const [ text ] = boardButton.children

					assert(text, isTruthy, isText)

					boards.push(text.data)
				}
			}

			assert(userSelect, isTruthy, isTag)

			const [ , userSelector ] = userSelect.children

			assert(userSelector, isTruthy, isTag)

			const dataUsers = userSelector.attribs["data-users"]

			assert(dataUsers)

			const json = JSON.parse(dataUsers) as JSONValue

			assert(json, Array.isArray)

			resolve(json)
		}))

		request({
			method: "GET",
			hostname,
			path: "/forums",
			headers: {
				Cookie: `_session_id=${sessionID}`
			}
		}, res => res
			.on("data", (chunk: Buffer) => parser.write(chunk.toString()))
			.on("end", () => parser.end())
		).end()
	})
}

export function getSessionID() {
	return new Promise<Node[]>(async (resolve, reject) => {
		lib.request({
			method: "GET",
			hostname,
			path: "/accounts/auth/steam"
		}).then(({ res }) => console.log(res.headers))
	})
}
