## Project context
The hanze library has a problem. Namely that students are not using their facilities to their fullest extent. A previous student by the name of Edona Ramadani was tasked with finding out why and think of a sollution to this issue. Her research identified a few things.

- Students do not know where the library is located.
- Students think the library is too far away 
- Students think they can use less complex alternatives (such as google)

## The idea
She set out to solve this issue by instead of enticing students to come to the library, the library should come to the students. She conceptualised the idea of multiple mini libraries placed at locations students of specific studies often frequent. The idea is to outfit every library with books only relevant to a particular study. 

![mockup.](/images/projects/hanze-mini-library/mockup.png "mini library mockup")

This way students would see these facilities and might make more use of them in the future.

## Implementation
This is where i come into the picture. A proof of concept had to be made to test the feasability of such an idea. 

I built a prototype where a simple cabinet becomes an interactive system. Students can walk up to it, browse books on a screen, scan their student card, and borrow a book within seconds.

Behind that simple interaction is a combination of software, hardware, and system integration.

The application runs as a desktop app built with Angular and Electron, designed as a kiosk interface. It communicates with an RFID reader to identify both books and student cards. When a valid action is performed, a microcontroller triggers an electronic lock, physically opening the cabinet.

<!-- youtube https://www.youtube.com/watch?v=5JrJ0zTZ4t4 -->

What looks like a basic interaction is actually a chain of coordinated events between multiple systems.

## From cabinet to connected system

At first glance, the project looks simple: a cabinet with books and a screen.

But behind that is a system where multiple layers work together in real time.

When a student borrows a book, the system needs to:
- identify the user via RFID  
- retrieve book data  
- validate the action  
- communicate with a library system  
- and finally trigger a physical lock  

To make that work, I had to design and connect a full stack — from UI down to hardware.

## Building a kiosk-style frontend with Angular + Electron

The user interface is built with Angular, mainly because of its structured, component-based approach. Since the app needed to guide users step-by-step (scan book → scan card → open cabinet), having clear state management and reusable components made a big difference.

But this wasn’t a typical web app.

The system runs on a physical kiosk, so I used Electron to wrap the Angular app into a desktop application. That allowed me to:
- run the app locally without a browser  
- access system-level features like USB ports  
- communicate directly with hardware  

In practice, Electron acted as the bridge between the web world and the physical device.

For styling, I used Tailwind CSS to quickly build a clean and responsive interface, and PrimeNG to speed up UI development with ready-made components like dialogs and notifications.

## Handling real-time hardware with Node.js

Because Electron includes a Node.js runtime, I could handle hardware communication directly inside the application.

To communicate with the microcontroller, I used the `node-serialport` library. This allowed the app to send commands over USB and receive status updates.

For example:
- when a user completes a valid action → send "unlock" command  
- microcontroller receives it → activates relay → cabinet opens  

This event-driven approach worked well because Node.js naturally fits asynchronous communication.

## Controlling the physical world with an ESP32

On the hardware side, I used an ESP32 microcontroller.

Its job is simple but critical: control the electronic lock. It listens for commands coming from the application via USB and switches a relay to power the lock.

What I liked about this setup is how direct it is:
- no network dependency  
- no latency from wireless communication  
- just a reliable serial connection  

It’s a small detail, but choosing USB over WiFi or Bluetooth made the system much more stable and safer.

## Working with RFID and library protocols

For identifying books and users, the system uses RFID.

When a book or student card is scanned, the system receives a unique ID. That ID is then used to:
- look up book data
- identify the user  
- trigger the correct action  

On the integration side, I worked with two different approaches:

**1. REST APIs**  
Used to fetch book metadata like title, author, and availability. These are straightforward HTTP requests secured with tokens.

**2. SIP2 protocol**  
This is a library-specific protocol used for lending, returning, and extending books. It’s older and not encrypted by default, so I used Stunnel to wrap it in SSL.

This was one of the more interesting parts of the project — working with a domain-specific protocol instead of typical REST-only systems.

---

## Why I kept the architecture simple

Even though the system has multiple parts, I deliberately kept the architecture monolithic.

That means the UI, business logic, hardware communication, and integrations all live in one application.

In a larger system, that wouldn’t scale well. But for this project, it made development faster and debugging much easier — especially when dealing with hardware.

---

## Where things got tricky

The biggest technical challenge wasn’t building the system — it was integrating with external services.

I didn’t get full access to the actual library APIs (OCLC WMS), so I had to simulate parts of the backend. That meant creating mock responses and hardcoded data to keep the system functional.

It’s not ideal, but it reflects real-world development: sometimes you build around constraints instead of waiting for perfect conditions.

---

## What this stack taught me

What I found most valuable about this project is how the stack comes together:

- Angular handles structured UI and user flow  
- Electron bridges web and desktop environments  
- Node.js enables real-time hardware communication  
- ESP32 connects software to the physical world  
- RFID and SIP2 tie everything into an existing ecosystem  

Each layer solves a different problem, and the real challenge is making them work as one system.

---

## Final thoughts

This project isn’t just about the technologies themselves, it’s about how they interact.

It’s one thing to build a frontend or write backend logic. It’s another to create a system where:
software triggers hardware,  
hardware responds in real time,  
and everything fits into an existing infrastructure.

That’s what made this project interesting — and honestly, a lot of fun to build.