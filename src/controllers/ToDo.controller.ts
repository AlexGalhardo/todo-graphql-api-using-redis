import * as jsonwebtoken from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { redis } from "src/config/redis";

export default class ToDoController {
	static async getToDoById(params, context){
		try {
			const authorizationHeader = context.authorization;
			if (!authorizationHeader) throw new Error("Authorization Header Missing");

			const token = authorizationHeader.split(" ")[1];
			if (!token) return { success: false, message: "Token Missing in Header Authorization Bearer" };

			const decodedToken = jsonwebtoken.verify(token, process.env.JWT_SECRET_KEY);

			const userFound = await redis
				.get(`user:${decodedToken.userEmail}`)
				.then((result) => {
					return JSON.parse(result);
				})
				.catch((error) => {
					throw new Error(error);
				});

			if (!userFound) return { success: false, message: "User not found" };

			const todo = JSON.parse(await redis.get(`todo:${params.id}`));

			return { success: true, todo }
		} catch (error: any) {
			return { success: false, message: error.message };
		}
	}

	static async newToDo(params, context){
		try {
			const authorizationHeader = context.authorization;
			if (!authorizationHeader) throw new Error("Authorization Header Missing");

			const token = authorizationHeader.split(" ")[1];
			if (!token) return { success: false, message: "Token Missing in Header Authorization Bearer" };

			const decodedToken = jsonwebtoken.verify(token, process.env.JWT_SECRET_KEY);

			const userFound = await redis
				.get(`user:${decodedToken.userEmail}`)
				.then((result) => {
					return JSON.parse(result);
				})
				.catch((error) => {
					throw new Error(error);
				});

			if (!userFound) return { success: false, message: "User not found" };

			const todo = {
				id: randomUUID(),
				user_id: userFound.id,
				user_email: userFound.email,
				title: params.title,
				done: false,
				updated_at: null,
				created_at: new Date().toISOString(),
			};

			await redis.set(`todo:${todo.id}`, JSON.stringify(todo));

			await redis.sadd(`user:${userFound.email}:todos`, todo.id);

			return { success: true, todo }
		} catch (error: any) {
			return { success: false, message: error.message };
		}
	}

	static async allToDos(context){
		try {
			const authorizationHeader = context.authorization;
			if (!authorizationHeader) throw new Error("Authorization Header Missing");

			const token = authorizationHeader.split(" ")[1];
			if (!token) throw new Error("Token Missing in Header Authorization Bearer");

			const decodedToken = jsonwebtoken.verify(token, process.env.JWT_SECRET_KEY);

			const userFound = await redis
				.get(`user:${decodedToken.userEmail}`)
				.then((result) => {
					return JSON.parse(result);
				})
				.catch((error) => {
					throw new Error(error);
				});

			if (!userFound) return { success: false, message: "User not found" };

			const todoIds = await redis.smembers(`user:${userFound.email}:todos`);

			const todos = await Promise.all(
				todoIds.map(async (id) => {
					const todoString = await redis.get(`todo:${id}`);
					return JSON.parse(todoString);
				})
			);

			return { success: true, todos };
		} catch (error: any) {
			return { success: false, message: error.message };
		}
	}
}

