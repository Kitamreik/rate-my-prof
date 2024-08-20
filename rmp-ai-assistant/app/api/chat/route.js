import { NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
const Groq = require('groq-sdk');
//import OpenAI from 'openai'

const systemPrompt = `
You are a rate my professor agent to help students find classes, that takes in user questions and answers them.
For every user question, the top 3 professors that match the user question are returned.
Use them to answer the question if needed.
`

export async function POST(req) {
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      })
      const index = pc.index('rag').namespace('ns1')
      const client = new Groq(process.env.GROQ_API_KEY);
      //const openai = new OpenAI()

      //OpenAI query processing
      /*
        const text = data[data.length - 1].content
        const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
        })
      */

       // Fetch completion from Groq SDK
    let text = data[data.length - 1].content
    try {
        const embedding = await client.chat.embeddings.create({
            model: "llama3-8b-8192",
            messages: [
                {
                    role: "system",
                    content: selectedSystemPrompt
                },
                {
                    role: "user",
                    content: content
                }
            ],
            temperature: 1,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null
        });

        // Log the response from Groq SDK
        console.log("Groq SDK response:", embedding);

        //Query Pinecone
        const results = await index.query({
            topK: 5,
            includeMetadata: true,
            vector: embedding.data[0].embedding,
          })

        //Format the results
        let resultString = ''
        results.matches.forEach((match) => {
        resultString += `
        Returned Results:
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n`
        })

        //Kit: check for results
        if (!resultString) {
            throw new Error("No message content found in the response.");
        }

        //Prepare the request
        const lastMessage = data[data.length - 1]
        const lastMessageContent = lastMessage.content + resultString
        const lastDataWithoutLastMessage = data.slice(0, data.length - 1)

        //Send the request
        const completion = await client.chat.embeddings.create({
            model: "llama3-8b-8192",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                ...lastDataWithoutLastMessage,
                {
                    role: "user",
                    content: lastMessageContent
                }
            ],
            temperature: 1,
            max_tokens: 1024,
            top_p: 1,
            stream: true,
            stop: null
        });

        //Create a ReadableStream to handle the streaming response
        const stream = new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder()
              try {
                for await (const chunk of completion) {
                  const content = chunk.choices[0]?.delta?.content
                  if (content) {
                    const text = encoder.encode(content)
                    controller.enqueue(text)
                  }
                }
              } catch (err) {
                controller.error(err)
              } finally {
                controller.close()
              }
            },
          })
          return new NextResponse(stream)


    } catch (error) {
        console.error("Error with Groq SDK request:", error);
        return NextResponse.json({ error: "Failed to get completion from Groq SDK" }, { status: 500 });
    }

  }