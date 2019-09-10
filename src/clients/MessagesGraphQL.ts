import { path } from 'ramda'

import { AppGraphQLClient, InstanceOptions } from '../HttpClient'
import { IOContext } from '../service/typings'
import { IOMessage } from '../utils/message'

type IOMessageInput = Pick<IOMessage, 'id' | 'content' | 'description' | 'behavior'>

export type IOMessageInputV2 = Pick<IOMessageV2, 'content' | 'context' | 'behavior'>

type Behavior = 'FULL' | 'USER_ONLY' | 'USER_AND_APP'

export interface IOMessageV2 extends IOMessageInputV2 {
  content: string
  context?: string
  behavior?: Behavior
  from?: string
  to?: string
}

interface MessagesInput {
  provider: string,
  messages: IOMessageInput[],
}

export interface IOMessageSaveInput extends IOMessageInput {
  content: string
}

export interface Translate {
  messages: MessagesInput[]
  from?: string
  to: string
}

export interface TranslateInputV2 {
  messages: IOMessageInputV2[]
  from?: string
  to: string
}

export interface SaveArgs {
  to: string
  messagesByProvider: Array<{
    messages: IOMessageSaveInput[]
    provider: string
  }>
}

interface TranslateResponse {
  newTranslate: string[]
}

interface TranslatedV2 {
  translate: string[]
}

export class MessagesGraphQL extends AppGraphQLClient {
  constructor(vtex: IOContext, options?: InstanceOptions) {
    super('vtex.messages', vtex, options)
  }

  public translate = async (args: Translate): Promise<string[]> => this.graphql.query<TranslateResponse, { args: Translate }>({
    query: `
    query Translate($args: NewTranslateArgs!) {
      newTranslate(args: $args)
    }
    `,
    variables: { args },
  }, {
    metric: 'messages-translate',
  }).then(path(['data', 'newTranslate'])) as Promise<TranslateResponse['newTranslate']>

  public translateV2 = (args: TranslateInputV2) => this.graphql.query<TranslatedV2, { args: TranslateInputV2 }>({
      query: `
      query Translate($args: TranslateArgs!) {
        translate(args: $args)
      }
      `,
      variables: { args },
    }, {
      metric: 'messages-translate-v2',
    }).then(path(['data', 'translate'])) as Promise<TranslatedV2['translate']>

  public save = (args: SaveArgs): Promise<boolean> => this.graphql.mutate<boolean, { args: SaveArgs }>({
    mutate: `
    mutation Save($args: SaveArgs!) {
      save(args: $args)
    }
    `,
    variables: { args },
  }, {
    metric: 'messages-save-translation',
  }).then(path(['data', 'save'])) as Promise<boolean>

}

