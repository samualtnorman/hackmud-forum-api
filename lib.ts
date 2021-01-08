import { IncomingMessage } from "http"
import { request as request_, RequestOptions } from "https"
import { URL } from "url"

export type TypeGuard<A, B extends A> = (x: A) => x is B

export type JSONValue = string | number | boolean | JSONValue[] | JSONObject | null
export type JSONObject = { [key: string]: JSONValue }

export class CustomError extends Error {
	name = this.constructor.name
}

export class AssertError extends CustomError {}

export function indent(value: string, char = "\t", amount = 1) {
	return value.split("\n").map(value => char.repeat(amount) + value).join("\n")
}

export function assert(value: any): asserts value

export function assert<
	A,
	B extends A
>(
	value: A,
	g1: TypeGuard<A, B>
): asserts value is B

export function assert<
	A,
	B extends A,
	C extends B
>(
	value: A,
	g1: TypeGuard<A, B>,
	g2: TypeGuard<B, C>
): asserts value is C

export function assert<
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

export function assert(value: any, ...guards: Array<TypeGuard<any, any>>) {
	if (guards.length) {
		for (const guard of guards)
			if (!guard(value))
				throw new AssertError(`${value} failed ${guard.name || "assertion"}`)
	} else if (!value)
		throw new AssertError(`${value} failed assertion`)
}

export function isTruthy<T>(value: T): value is NonNullable<T> {
	return !!value
}

export function isJSONObject(value: JSONValue): value is JSONObject {
	return !!value && typeof value == "object" && !Array.isArray(value)
}

export function request(options: RequestOptions | string | URL, data?: any) {
	const buffers: Buffer[] = []

	return new Promise<{ res: IncomingMessage, data: string }>((resolve, reject) =>
		request_(options, res =>
			res	.on("data", (buffer: Buffer) => buffers.push(buffer))
				.on("end", () => resolve({ res, data: Buffer.concat(buffers).toString() }))
				.on("error", reject)
		).end(data)
	)
}
