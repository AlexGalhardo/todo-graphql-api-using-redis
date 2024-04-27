import "dotenv/config";
import { Elysia } from "elysia";
import { apollo, gql } from "@elysiajs/apollo";
import { cors } from "@elysiajs/cors";
import AuthController from "./controllers/Auth.controller";
import ToDoController from "./controllers/ToDo.controller";

const app = new Elysia()
	.use(
		cors({
			origin: "*",
		}),
	)
	.use(
		apollo({
			typeDefs: gql`
                type ToDo {
                    id: String
                    title: String
                    done: Boolean
                    updated_at: String
                    created_at: String
                }

                type User {
                    id: ID!
                    name: String!
                    email: String!
                    password: String!
                    updated_at: String
                    created_at: String
                    jwt_token_session: String
                }

                type signupResponse {
                    success: Boolean!
                    user: User
                    message: String
                }

                type loginResponse {
                    success: Boolean!
                    user: User
                    message: String
                }

                type Query {
                    toDo(id: String!): ToDo
                    allToDos: [ToDo]
					getToDoById(id: String!): ToDo
                }

                type Mutation {
                    signup(name: String!, email: String!, password: String!): signupResponse
                    login(email: String!, password: String!): loginResponse
                    newToDo(title: String!): ToDo
                    updateToDo(id: String!, title: String!, done: Boolean!): ToDo
                    deleteToDo(id: String!): String
                }
            `,
			resolvers: {
				Mutation: {
					signup: async (_, params) => AuthController.signup(params),
					login: async (_, params) => AuthController.login(params),
					newToDo: async (_, params, context: { authorization: string }) => ToDoController.newToDo(params, context),
				},
				Query: {
					allToDos: async (_, __, context) => ToDoController.allToDos(context),
					getToDoById: async (_, params, context: { authorization: string }) => ToDoController.getToDoById(params, context),
			},
			context: async ({ request }) => {
				const authorization = request.headers.get("Authorization");
				return {
					authorization,
				};
			},
		}}),
	)
	.derive(({ headers }) => {
		const auth = headers["authorization"];
		return {
			jwt: auth?.startsWith("Bearer ") ? auth.slice(8) : "token not found",
		};
	})
	.listen(3000, () => {
		console.log(`🦊 Elysia is running at http://localhost:3000`);
	});

app.handle(new Request("http://localhost:3000/graphql")).then(console.log);
