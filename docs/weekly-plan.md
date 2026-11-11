## Week 11 (11-11 ~ 11-17)

#### Implement furniture/room creation and management, and My Projects management

Yunseok Oh | Frontend

- Implement basic app structure and bottom navigation
- Implement room list and room create/edit UI
- Implement furniture list and furniture create/edit UI
- Build common card and button UI components
- Verify screen behavior using mock data

Minhyung Lee | Backend

- Set up Room DB and Firebase environment
- Implement data models for rooms, furniture, projects, and layouts
- Implement room/furniture CRUD and Repository
- Begin implementing project/layout repositories
- DB unit tests

Junha Kang | PM & Development

- Implement project list screen
- Implement project main screen and layout card UI
- Implement UI for creating, duplicating, and deleting layouts
- Implement per-layout furniture count button and selection screen
- Verify behavior of developed screens and log bugs

Independent Development Principles

- FE: Build room/furniture screens using mock data
- BE: Develop CRUD via Repository tests without UI (avoiding conflicts)
- PM: Develop project UI on a separate temporary entry screen, using a mock list for data

## Week 12 (November 18 - November 24)

#### Implement furniture placement features (loading rooms/furniture, collision checks, etc.)

**Yunseok Oh | Frontend**

- Implement 2D grid placement screen
- Implement furniture drag and 90-degree rotation controls
- Display info and dimensions of the selected furniture
- Collision warning message UI
- Connect placement screen with project screen

**Minhyung Lee | Backend**

- Complete project/layout CRUD
- Save furniture list per layout
- Save/load furniture coordinates and rotation state
- Implement Firebase Authentication
- Integrate existing room/furniture data with placement data

**Junha Kang | PM & Development**

- Conversion logic between real dimensions ↔ grid coordinates
- Calculate occupied area after furniture rotation
- Furniture-to-furniture collision detection
- Collision detection for room boundaries and door swing range
- Write and run collision detection unit tests
- Integration verification of Week 10 features

**Independent Development Approach**

- FE: Develop placement UI using mock furniture and mock collision results
- BE: Develop save/load features using arbitrary coordinate data
- PM: Develop the collision engine as pure Kotlin calculation functions independent of UI, with unit tests

## Week 13 (November 25 ~ December 1)

#### Implement project invitation/acceptance features, etc., and check feature integration

**Yunseok Oh | Frontend**

- Implement My Page UI
- Implement friend list and add-friend screens
- Project invitation and accept/decline UI
- Shared project display and notification UI
- Polish incomplete UI in room, furniture, and placement screens

**Minhyung Lee | Backend**

- Firestore shared project data structure and storage
- Handle friend requests and project invitations
- Participant access permission management
- Sync collaborative edits
- Test sharing features with multiple accounts

**Junha Kang | PM & Development**

- Implement room environment settings screen
- Implement repositioning of doors, windows, and outlets
- Window height vs. furniture interference detection
- Outlet obstruction warning detection
- Unit tests for collision detection and room environment settings
- Integration verification and bug fixes for core placement features

**Independent Development Approach**

- FE: Develop My Page using sample profile, friend, and invitation data
- BE: Develop sharing API and permission features using test accounts and data
- PM: Develop with a standalone room environment editor screen and mock room data, extending the previous week's collision engine

## Weeks 14-15 (December 2 - December 8)

#### Check for conflicts across the three members' work, fix bugs, and prepare the presentation
>> Integrated feature testing around the weekend (produce presentation video)

After that, build any unimplemented features, then do the final review and polish
