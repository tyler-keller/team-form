List of all prompts run:

create a full-stack project with a react frontend, express backend, and sqlite database.  
the app is a student team creation tool.  
set up the following:  
- frontend in react with vite  
- backend in express  
- sqlite for persistence, using prisma or better-sqlite3  
- basic project folder structure: frontend/, backend/  
- include scripts for running backend and frontend separately  
- create a simple hello world route to test backend/frontend connection.  

in the react frontend, add a page with a student profile input form.  
fields: name, email, major, skills (comma-separated tags), availability (should be an interactive time-blocking ui), interests (text).  
save this profile to the backend via a POST request.  
backend should save profiles into a sqlite table `students` with the same fields.  
include a GET route to fetch all students.  

add a "create team" page.  
functionality:  
- display all students from the backend.  
- allow selecting students via checkboxes to form a team.  
- enter a team name.  
- when submitting, send to backend. backend should save team in a `teams` table and create a join table `team_members`.  
- include a GET route to fetch teams and their members.  

implement an "auto-generate team" feature.  
logic:  
- fetch all students.  
- group students into teams of 3–4, balancing by skills and availability.  
- create simple matching algorithm:  
   - try to distribute skills evenly.  
   - ensure average availability is close across teams.  
- save generated teams to the db.  
frontend: add a button "auto-generate teams" that triggers this and shows results. 

implement a proper app flow:
- define an instructor role that can create new projects with a name, description, minimum and maximum team size and a list of emails for all students partaking in the project
- create empty teams with a default team number where the total number of teams is the maximum possible with minimum team size
- pretend to send out emails to all students in the list requesting them to complete their profiles and join a team
- when the link is clicked, route the student to the create profile page
- when they're down creating their profile, allow them access to join teams and edit their team name/description