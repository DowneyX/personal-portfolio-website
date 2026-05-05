## Problem Context
During my internship, I built a full-stack web application to replace a fragmented production tracking process. The company relied heavily on Excel sheets and manual input, which introduced delays, inconsistencies, and a lack of real-time visibility.

The goal of this project was to design and implement a centralized system that provides live insight into production progress and key performance indicators (KPIs), while reducing manual data handling.

The existing workflow had a few structural issues:

- Sales orders were stored in one system, while production data was tracked separately
- Production updates were written down during the day and only processed afterward
- There was no real-time visibility into progress or performance

This meant that management could only react *after* issues had already occurred.

## System Architecture

The application is built as a classic full-stack web application with a clear separation between front-end, back-end, and data storage:

- **Frontend:** Angular
- **Backend:** Spring Boot (REST API)
- **Database:** PostgreSQL
- **Data Visualization:** ngx-charts

The frontend communicates with the backend via REST endpoints, while the backend handles business logic, data processing, and integration with external systems.

## Core Features

The application focuses on providing real-time insight into production and simplifying data input:

- Centralized overview of sales orders
- Real-time tracking of production progress
- Input system for production mutations (per production line)
- KPI visualization (e.g. worked hours, expected output, efficiency)

The system is designed with multiple user roles in mind, ensuring that each type of user sees relevant information.

## Dashboard Overview (Add Screenshot)

![hupak order](/images/projects/hupak-dashboard/order.png "wireframe of oder screen")


## Data Model & Backend Design

The backend is structured around a relational data model that connects:

- Sales orders
- Production lines
- Mutations (production updates)
- Users

Spring Boot is used to expose REST endpoints for CRUD operations and data retrieval. The API aggregates and processes raw data into meaningful metrics, such as:

- Total produced vs. planned output
- Worked hours per order
- Remaining time based on target rates

Database management is handled with PostgreSQL, providing a reliable and scalable foundation for structured data.

## Frontend Implementation

The frontend is built using Angular with a component-based architecture. Key aspects include:

- Reusable UI components for tables, forms, and charts
- Service layer for API communication
- State handling within components for real-time updates

For visualization, **ngx-charts** is used to display dynamic graphs that reflect production performance. These charts update based on incoming data, giving users immediate feedback.

![hupak order](/images/projects/hupak-dashboard/line-overview.png "wireframe of line view")

## Development Approach

The project was developed using an Agile workflow with short iterations. Each sprint included:

- Planning and prioritization
- Implementation
- Demo and feedback

Task management was handled using a Kanban board, which helped keep progress transparent and manageable.

One of the main challenges during development was integrating external systems (such as accounting software). This required adapting the backend structure and handling incomplete or unclear API documentation.


## Challenges & Trade-offs

Like most real-world projects, not everything could be fully completed within the timeframe. Some limitations include:

- Limited validation on user input
- Certain features not yet editable (e.g. production configurations)

These trade-offs were made to prioritize delivering a working core system within the available time.


## What I Learned

This project gave me hands-on experience with:

- Designing and building a full-stack application
- Structuring a backend with Spring Boot
- Working with relational databases in PostgreSQL
- Building dynamic dashboards with Angular
- Translating business requirements into technical solutions

It also reinforced the importance of adaptability—requirements changed, technical constraints appeared, and priorities shifted throughout the project.


## Future Improvements

If I were to continue this project, the next steps would include:

- Improving validation and error handling
- Optimizing performance (e.g. pagination, query optimization)