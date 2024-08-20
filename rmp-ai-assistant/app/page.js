'use client' //The `’use client’` directive at the top indicates that this is a client-side component.
import { Box, Button, Stack, TextField } from '@mui/material'
import { useState } from 'react'

//main `Home` component:
export default function Home() {
    // establish state
    const [messages, setMessages] = useState([
        {
          role: 'assistant',
          content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
        },
      ])
    const [message, setMessage] = useState('')
    // Implement the sendMessage function
    const sendMessage = async () => {
        setMessage('')
        setMessages((messages) => [
          ...messages,
          {role: 'user', content: message},
          {role: 'assistant', content: ''},
        ])
      
        const response = fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([...messages, {role: 'user', content: message}]),
        }).then(async (res) => {
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let result = ''
      
          return reader.read().then(function processText({done, value}) {
            if (done) {
              return result
            }
            const text = decoder.decode(value || new Uint8Array(), {stream: true})
            setMessages((messages) => {
              let lastMessage = messages[messages.length - 1]
              let otherMessages = messages.slice(0, messages.length - 1)
              return [
                ...otherMessages,
                {...lastMessage, content: lastMessage.content + text},
              ]
            })
            return reader.read().then(processText)
          })
        })
      }
      //Create the UI layout - Add the JSX for the chat interface:

      /*
    This frontend component creates a chat interface where users can send messages to the AI assistant and see the responses. Here’s what each part does:

    1. We use Material-UI components to create a responsive layout.
    2. The chat messages are displayed in a scrollable area, with different colors for user and assistant messages.
    3. An input field allows users to type their messages, and a “Send” button triggers the `sendMessage` function.
    4. The `sendMessage` function sends the user’s message to our API, then processes the streamed response, updating the UI in real-time as the assistant’s message is received.

    With this frontend in place, users can now interact with our Rate My Professor AI Assistant through a user-friendly chat interface. The assistant will provide responses based on the data we set up in our Pinecone database, offering relevant information about professors and classes.
      */
      return (
        <Box
          width="100vw"
          height="100vh"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Stack
            direction={'column'}
            width="500px"
            height="700px"
            border="1px solid black"
            p={2}
            spacing={3}
          >
            <Stack
              direction={'column'}
              spacing={2}
              flexGrow={1}
              overflow="auto"
              maxHeight="100%"
            >
              {messages.map((message, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent={
                    message.role === 'assistant' ? 'flex-start' : 'flex-end'
                  }
                >
                  <Box
                    bgcolor={
                      message.role === 'assistant'
                        ? 'primary.main'
                        : 'secondary.main'
                    }
                    color="white"
                    borderRadius={16}
                    p={3}
                  >
                    {message.content}
                  </Box>
                </Box>
              ))}
            </Stack>
            <Stack direction={'row'} spacing={2}>
              <TextField
                label="Message"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button variant="contained" onClick={sendMessage}>
                Send
              </Button>
            </Stack>
          </Stack>
        </Box>
      )
  }

  //Code Along: https://medium.com/@billzhangsc/building-a-rag-powered-ai-assistant-the-rate-my-professor-project-19b8a999313a