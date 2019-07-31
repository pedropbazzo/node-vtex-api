import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import { map } from 'ramda'

import { ServiceContext } from '../../../typings'
import { messagesLoader } from '../messagesLoader'


export class Translatable extends SchemaDirectiveVisitor {
  public visitFieldDefinition (field: GraphQLField<any, ServiceContext>) {
    const { resolve = defaultFieldResolver } = field
    const { behavior = 'FULL' } = this.args
    field.resolve = async (root, args, context, info) => {
      const { clients: { segment }, clients, vtex: { locale } } = context
      if (!context.loaders || !context.loaders.messages) {
        context.loaders = {
          ...context.loaders,
          messages: messagesLoader(clients),
        }
      }

      const isNotTranslatableString = (response: any) => {
        return typeof response !== 'string' && typeof response !== 'object'
      }

      const isNotTranslatableStringArray = (response: any) => {
        if(!Array.isArray(response)) {
          return true
        }

        let isArrayWithOnlyTranslatableStrings = true
        response.map(
          element => {
            if(isNotTranslatableString(element)) {
              isArrayWithOnlyTranslatableStrings = false // find a way to optmize and break the "map"  process in this case
            }
          }
        )

        return !isArrayWithOnlyTranslatableStrings
      }

      const response = await resolve(root, args, context, info)

      // Messages only knows how to process non empty strings, here we also allow array of strings
      if (isNotTranslatableString(response) || isNotTranslatableStringArray(response)  || response == null) {
        return response
      }

      const handleTranslatableString = async (response: any) => {
        const resObj = typeof response === 'string'
          ? {
            content: response,
            description: '',
            from: undefined,
            id: response,
          }
          : response
        const { content, from, id } = resObj

      const to =
        locale != null
          ? locale
          : (await segment.getSegment()).cultureInfo

        if (content == null && id == null) {
          throw new Error(`@translatable directive needs a content or id to translate, but received ${JSON.stringify(response)}`)
        }

        // If the message is already in the target locale, return the content.
        if (!to || from === to) {
          return content
        }

        return context.loaders.messages!.load({
          ...resObj,
          from,
          to,
        })
      }

      const handleTranslatableStringArray = async (response: any) => {
        return map (
          (element: any) => handleTranslatableString(element),
          response
        )
      }

      if(Array.isArray(response)) {
        return handleTranslatableStringArray(response)
      } else {
        return handleTranslatableString(response)
      }
    }
  }
}
