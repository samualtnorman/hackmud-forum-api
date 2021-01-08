import { Node } from "domhandler"
import { isComment, isTag, isText } from "domutils"
import { getForum, getSessionID } from "."
import { indent } from "./lib"

getSessionID().then(node => stringifyNode(node)).then(console.log)

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
