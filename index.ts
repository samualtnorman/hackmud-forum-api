import { request } from "https"
import { Parser, DomHandler } from "htmlparser2"
import { Node } from "domhandler"
import { isText, isTag, isComment } from "domutils"

type TypeGuard<A, B extends A> = (x: A) => x is B

type JSONValue = string | number | boolean | JSONValue[] | JSONObject | null
type JSONObject = { [key: string]: JSONValue }

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

class CustomError extends Error {
	name = this.constructor.name

	constructor(message: string) {
		super(message)
	}
}

class AssertError extends CustomError {
	constructor(message: string) {
		super(message)
	}
}

const hostname = "hackmud.com"

getForum()

function getForum() {
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

			console.log(json)
		}))

		request({
			method: "GET",
			hostname,
			path: "/forums",
			headers: {
				Cookie: "_session_id=d4bc306b5bfcd7668dafa90b960a7b23"
			}
		}, res => res
			.on("data", (chunk: Buffer) => parser.write(chunk.toString()))
			.on("end", () => parser.end())
		).end()
	})
}

function stringifyNode(node: Node | Node[], recursive = Infinity): string {
	if (Array.isArray(node))
		return node.map(node => stringifyNode(node, recursive)).join("\n")

	if (isText(node))
		return "text " + JSON.stringify(node.data)

	if (isTag(node)) {
		let o = node.name + " " + node.attributes.map(({ name, value }) => `${name}: ${/\s/g.test(value) ? JSON.stringify(value): value}`).join(", ")

		if (!recursive)
			o += " {" + node.children.length + "}"
		else if (node.children.length)
			o += " {\n" + indent(stringifyNode(node.children, recursive - 1), "    ") + "\n}"
		else
			o += " {}"

		return o
	}

	if (isComment(node))
		return "comment " + JSON.stringify(node.data)

	console.log(node)

	throw new Error("unknown node type")
}

function indent(value: string, char = "\t", amount = 1) {
	return value.split("\n").map(value => char.repeat(amount) + value).join("\n")
}

function assert(value: any): asserts value

function assert<
	A,
	B extends A
>(
	value: A,
	g1: TypeGuard<A, B>
): asserts value is B

function assert<
	A,
	B extends A,
	C extends B
>(
	value: A,
	g1: TypeGuard<A, B>,
	g2: TypeGuard<B, C>
): asserts value is C

function assert<
	A,
	B extends A,
	C extends B,
	D extends C
>(
	value: A,
	g1: TypeGuard<A, B>,
	g2: TypeGuard<B, C>,
	g3: TypeGuard<C, D>
): asserts value is D

function assert(value: any, ...guards: Array<TypeGuard<any, any>>) {
	if (guards.length) {
		for (const guard of guards)
			if (!guard(value))
				throw new AssertError(`${value} failed ${guard.name || "assertion"}`)
	} else if (!value)
		throw new AssertError(`${value} failed assertion`)
}

function isTruthy<T>(value: T): value is NonNullable<T> {
	return !!value
}

function isJSONObject(value: JSONValue): value is JSONObject {
	return !!value && typeof value == "object" && !Array.isArray(value)
}
