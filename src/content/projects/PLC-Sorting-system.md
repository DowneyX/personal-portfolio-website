## Project Context

Due to my interest in industrial automation, I wanted to gain hands-on experience with PLC programming. My background is primarily in software engineering and data visualization, so I decided to build a small project that would help me learn the fundamentals of PLC development and the tooling commonly used in the industry.

## Implementation

After doing some research, I discovered that Siemens is one of the most widely used PLC vendors in Europe. As a result, I decided to explore the Siemens ecosystem, including TIA Portal and PLCSIM Advanced. To simulate the physical environment, I used Factory I/O.

The setup is relatively simple. A main conveyor supplies pallets and transfers them onto a turntable. Depending on the user's input, the turntable must rotate and unload the pallet either to the left or to the right.

![Conveyor Setup](/images/projects/PLC-sorting-system/conyeyor_setup.png "Setup of the hardware")

After creating a virtual PLC, I assigned tags to all relevant inputs and outputs.

![tag table](/images/projects/PLC-sorting-system/tag_table.png "tag table")

![tag table](/images/projects/PLC-sorting-system/virtual_plc.png "vitual plc")

Next, I wanted to explore how closely software engineering principles translate to PLC programming. For systems like this, I would typically implement a state machine. In a state-driven architecture, the system transitions between a series of states, with each state being responsible for a specific part of the process.

To visualize the design, I created the following state diagram.

![state diagram](/images/projects/PLC-sorting-system/state_diagram.png "state diagram for state machine")

The states I defined are:

* `STATE_LOADING`
* `STATE_WAIT_INPUT`
* `STATE_TURNING`
* `STATE_UNLOAD_LEFT`
* `STATE_UNLOAD_RIGHT`
* `STATE_RESET`

Once the state machine was designed, it was time to implement it in TIA Portal. I chose Structured Control Language (SCL) because its syntax felt the most familiar coming from a software engineering background.

The final implementation is shown below.

```SCL
Turntable [FB1]

"Q_ConveyorLeft" := TRUE;
"Q_ConveyorRight" := TRUE;

#rExitLeft(CLK := "S_ExitLeft");
#fExitLeft(CLK := "S_ExitLeft");

#rExitRight(CLK := "S_ExitRight");
#fExitRight(CLK := "S_ExitRight");

#rFrontLS(CLK := "S_EntryFront");
#fFrontLS(CLK := "S_EntryFront");

CASE #I_State OF
    #STATE_LOADING:
        "Q_ConveyorEntry" := TRUE;
        "Q_TurntableREV" := TRUE;

        IF #fFrontLS.Q THEN
            "Q_ConveyorEntry" := FALSE;
        END_IF;

        IF "LS_TurntableBack" THEN
            "Q_TurntableREV" := FALSE;
            #I_State := #STATE_WAIT_INPUT;
        END_IF;

    #STATE_WAIT_INPUT:
        IF "PB_SelectLeft" THEN
            #I_Direction := #DIRECTION_LEFT;
            #I_State := #STATE_TURNING;
        END_IF;

        IF "PB_SelectRight" THEN
            #I_Direction := #DIRECTION_RIGHT;
            #I_State := #STATE_TURNING;
        END_IF;

    #STATE_TURNING:
        "Q_TurntableTurn" := TRUE;

        IF "LS_UnloadPosition" AND #I_Direction = #DIRECTION_RIGHT THEN
            #I_State := #STATE_UNLOAD_RIGHT;
        END_IF;

        IF "LS_UnloadPosition" AND #I_Direction = #DIRECTION_LEFT THEN
            #I_State := #STATE_UNLOAD_LEFT;
        END_IF;

    #STATE_UNLOAD_LEFT:
        "Q_TurntableREV" := TRUE;

        IF #fExitLeft.Q THEN
            #I_State := #STATE_RESET;
        END_IF;

    #STATE_UNLOAD_RIGHT:
        "Q_TurntableFWD" := TRUE;

        IF #fExitRight.Q THEN
            #I_State := #STATE_RESET;
        END_IF;

    #STATE_RESET:
        "Q_TurntableFWD" := FALSE;
        "Q_TurntableREV" := FALSE;
        "Q_TurntableTurn" := FALSE;
        "Q_ConveyorEntry" := FALSE;

        IF "LS_LoadPosition" THEN
            #I_State := #STATE_LOADING;
        END_IF;
END_CASE;
```

## Closing Thoughts

This project was both enjoyable and educational, providing a practical introduction to PLC programming and the Siemens toolchain. Unfortunately, due to a bug in my virtualization setup, I was unable to fully test the implementation in the simulated environment. In the future i will have to search for alternative methods to simulate my PLC or buy a physical device to test my systems.

See [factory I/O BUG](https://www.reddit.com/r/PLC/comments/1t7yp8x/factory_io_not_recognizing_inputs/)

Despite that limitation, the project achieved its main goal: helping me become familiar with PLC development concepts, state-based control logic, and the Siemens ecosystem.

In future projects, I would like to explore other PLC programming languages such as Ladder Logic (LAD) and Function Block Diagrams (FBD). I am also interested in implementing fault detection, alarm handling, and recovery mechanisms to make the system more robust. Additionally, I would like to learn more about Human-Machine Interfaces (HMIs) and how they can be integrated into industrial automation systems to improve monitoring and operator interaction. I will probably tackle these subjects in future projects.
