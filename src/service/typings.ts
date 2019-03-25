import { DataSource } from 'apollo-datasource'
import { GraphQLFieldResolver } from 'graphql'
import { IDirectiveResolvers } from 'graphql-tools'
import { ParameterizedContext } from 'koa'
import { Middleware } from 'koa-compose'
import { ParsedUrlQuery } from 'querystring'

import { ClientsImplementation, IOClients } from '../clients/IOClients'
import { InstanceOptions } from '../HttpClient'
import { Recorder } from '../HttpClient/middlewares/recorder'
import { StatusTrack } from '../metrics/MetricsAccumulator'

export interface Context<T extends IOClients> {
  clients: T
  vtex: IOContext
  dataSources?: DataSources
  timings: Record<string, [number, number]>
  metrics: Record<string, [number, number]>
}

type KnownKeys<T> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K
} extends { [_ in keyof T]: infer U } ? U : never

export type ServiceContext<ClientsT extends IOClients = IOClients, StateT = void, CustomT = void> = Pick<ParameterizedContext<StateT, Context<ClientsT>>, KnownKeys<ParameterizedContext<StateT, Context<ClientsT>>>> & CustomT

export type RouteHandler<ClientsT extends IOClients = IOClients, StateT = void, CustomT = void> = Middleware<ServiceContext<ClientsT, StateT, CustomT>>

export type Resolver<ClientsT extends IOClients = IOClients, StateT = void, CustomT = void> = GraphQLFieldResolver<any, ServiceContext<ClientsT, StateT, CustomT>, {[key: string]: any}>

export interface ClientsConfig<ClientsT extends IOClients = IOClients> {
  implementation?: ClientsImplementation<ClientsT>
  options: Record<string, InstanceOptions>
}

export type DataSourcesGenerator = () => {
  [name: string]: DataSource<ServiceContext>,
}

export interface GraphQLOptions<ClientsT extends IOClients = IOClients, StateT = void, CustomT = void> {
  resolvers: Record<string, Resolver<ClientsT, StateT, CustomT>>
  dataSources?: DataSourcesGenerator
  schemaDirectives?: IDirectiveResolvers<any, ServiceContext>
}

export interface ServiceConfig<ClientsT extends IOClients = IOClients, StateT = void, CustomT = void> {
  clients: ClientsConfig<ClientsT>
  events?: any,
  graphql?: GraphQLOptions<ClientsT, StateT, CustomT>,
  routes: Record<string, RouteHandler<ClientsT, StateT, CustomT> | Array<RouteHandler<ClientsT, StateT, CustomT>>>
}

export interface RuntimeConfig<ClientsT extends IOClients = IOClients, StateT = void, CustomT = void> {
  events?: any,
  routes: Record<string, RouteHandler<ClientsT, StateT, CustomT>>
  statusTrack?: StatusTrack,
  __is_service: true
}

export interface DataSources {
  [name: string]: DataSource<ServiceContext>,
}

export interface IOContext {
  account: string
  authToken: string
  production: boolean
  recorder?: Recorder
  region: string
  route: {
    declarer?: string
    id: string
    params: ParsedUrlQuery
  }
  userAgent: string
  workspace: string
  segmentToken?: string
  sessionToken?: string
  requestId: string
  operationId: string
}
