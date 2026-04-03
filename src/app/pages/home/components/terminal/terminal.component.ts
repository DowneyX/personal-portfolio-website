import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

type DirectoryNode = {
  [name: string]: DirectoryNode;
};

@Component({
  selector: 'app-terminal',
  imports: [],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
})
export class TerminalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('terminalHost') terminalHost!: ElementRef<HTMLDivElement>;

  private terminal?: Terminal;
  private fitAddon?: FitAddon;
  private currentCommand = '';
  // fake directory structure
  private directoryStructure: DirectoryNode = {
    'home': {
      'projects': {
          'project1.txt': {},
          'project2.txt': {},
      },
      'about.txt': {},
      'contact.txt': {},
      'documents': {
        'resume.pdf': {},
        'world_domination_plan.txt': {},
      },
    }
  };
  private pwd = '/home';
  private readonly banner = `
                        /$$                                                  
                        | $$                                                  
 /$$  /$$  /$$  /$$$$$$ | $$  /$$$$$$$  /$$$$$$  /$$$$$$/$$$$   /$$$$$$       
| $$ | $$ | $$ /$$__  $$| $$ /$$_____/ /$$__  $$| $$_  $$_  $$ /$$__  $$      
| $$ | $$ | $$| $$$$$$$$| $$| $$      | $$  \\ $$| $$ \\ $$ \\ $$| $$$$$$$$      
| $$ | $$ | $$| $$_____/| $$| $$      | $$  | $$| $$ | $$ | $$| $$_____/      
|  $$$$$/$$$$/|  $$$$$$$| $$|  $$$$$$$|  $$$$$$/| $$ | $$ | $$|  $$$$$$$      
 \\_____/\\___/  \\_______/|__/ \\_______/ \\______/ |__/ |__/ |__/ \\_______/      

My name is Douwe Klip and this is my personal portfolio website. Welcome to my terminal interface! Here you can explore my projects, learn about my skills, and get in touch with me.

Feel free to use either the Website's UI navigation or the terminal to explore.
you can type 'help' to see available terminal commands
 `;

  private readonly mobileBanner = `
              _
             | |
__      _____| | ___ ___  _ __ ____  ___
\\ \\ /\\ / / _ \\ |/ __/ _ \\| '_ ' _  \\/ _ \\
 \\ V  V /  __/ | (__ (_) | | | | | |  __/
  \\_/\\_/ \\___|_|\\___\\___/|_| |_| |_|\\___|

My name is Douwe Klip and this is my personal portfolio website. Welcome to my terminal interface! Here you can explore my projects, learn about my skills, and get in touch with me.

Feel free to use either the Website's UI navigation or the terminal to explore.
you can type 'help' to see available terminal commands
 `;


  ngAfterViewInit() {
    this.terminal = new Terminal({
      cursorBlink: true,
      fontFamily: 'courier-prime, monospace',
      fontSize: 14,
      convertEol: true,
      scrollback: 1000,
      allowProposedApi: true,
      disableStdin: false,
      logLevel: 'off',
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
      },
    });

    // Initialize FitAddon for responsive sizing
    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    this.terminal.open(this.terminalHost.nativeElement);
    
    // Fit terminal to container size
    setTimeout(() => {
      this.fitAddon?.fit();
    }, 0);
    
    this.terminal.focus();
    
    // Clear any initial garbage or artifacts
    this.terminal.clear();
    
    // Write the ASCII art banner
    this.terminal.writeln(this.getBanner());
    this.terminal.writeln('');
    this.terminal.write(this.getPrompt());

    this.terminal.onData((data) => {
      this.handleInput(data);
    });
  }

  ngOnDestroy() {
    this.terminal?.dispose();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.fitAddon?.fit();
  }

  focusTerminal() {
    this.terminal?.focus();
  }

  private writePrompt() {
    this.terminal?.write(`\r\n${this.getPrompt()}`);
  }

  private getDisplayPath(): string {
    if (this.pwd === '/home') {
      return '~';
    }

    if (this.pwd.startsWith('/home/')) {
      return this.pwd.replace('/home', '~');
    }

    return this.pwd;
  }

  private getPrompt(): string {
    return `[portfolio-website ${this.getDisplayPath()}]$ `;
  }

  private getBanner(): string {
    return window.innerWidth <= 640 ? this.mobileBanner : this.banner;
  }

  private normalizePath(path: string): string {
    const parts = path.split('/');
    const stack: string[] = [];

    for (const part of parts) {
      if (!part || part === '.') {
        continue;
      }

      if (part === '..') {
        if (stack.length > 0) {
          stack.pop();
        }
        continue;
      }

      stack.push(part);
    }

    return `/${stack.join('/')}`;
  }

  private resolvePath(inputPath: string): string {
    if (inputPath === '~') {
      return '/home';
    }

    if (inputPath.startsWith('~/')) {
      return this.normalizePath(`/home/${inputPath.slice(2)}`);
    }

    if (inputPath.startsWith('/')) {
      return this.normalizePath(inputPath);
    }

    return this.normalizePath(`${this.pwd}/${inputPath}`);
  }

  private getDirectoryAtPath(path: string): DirectoryNode | undefined {
    const pathParts = path.split('/').filter(Boolean);
    let currentDir: DirectoryNode = this.directoryStructure;

    for (const part of pathParts) {
      const nextDir = currentDir[part];
      if (!nextDir) {
        return undefined;
      }
      currentDir = nextDir;
    }

    return currentDir;
  }

  private handleInput(data: string) {
    if (!this.terminal) {
      return;
    }

    if (data === '\r') {
      const command = this.currentCommand.trim();
      this.terminal.write('\r\n');

      if (command) {
        this.executeCommand(command);
      }

      this.currentCommand = '';
      this.terminal.write(this.getPrompt());
      return;
    }

    if (data === '\u007F') {
      if (this.currentCommand.length > 0) {
        this.currentCommand = this.currentCommand.slice(0, -1);
        this.terminal.write('\b \b');
      }
      return;
    }

    if (data === '\u0003') {
      this.currentCommand = '';
      this.terminal.write('^C');
      this.writePrompt();
      return;
    }

    if (data >= ' ') {
      this.currentCommand += data;
      this.terminal.write(data);
    }
  }

  private executeCommand(command: string) {
    if (!this.terminal) {
      return;
    }

    const [rawCommand, ...args] = command.trim().split(/\s+/);
    const commandName = rawCommand.toLowerCase();

    switch (commandName) {
      case 'help':
        this.terminal.writeln('Available commands: help, about, projects, contact, clear, ls, pwd, cd');
        break;
      case 'about':
        this.terminal.writeln('I am a software developer with experience in Angular, Node.js, and Python.');
        break;
      case 'projects':
        this.terminal.writeln('Project 1: Personal Portfolio Website');
        this.terminal.writeln('Project 2: E-commerce Platform');
        break;
      case 'contact':
        this.terminal.writeln('You can contact me at john.doe@example.com');
        break;
      case 'clear':
        this.terminal.clear();
        break;
      case 'ls':
        const currentDir = this.getDirectoryAtPath(this.pwd);
        if (!currentDir) {
          this.terminal.writeln('ls: cannot access current directory');
          break;
        }
        const entries = Object.keys(currentDir);
        this.terminal.writeln(entries.join('  '));
        break;

      case 'pwd':
        this.terminal.writeln(this.pwd);
        break;

      case 'cd': {
        const target = args[0] ?? '~';
        const resolvedPath = this.resolvePath(target);
        const targetDirectory = this.getDirectoryAtPath(resolvedPath);

        if (!targetDirectory) {
          this.terminal.writeln(`cd: no such file or directory: ${target}`);
          break;
        }

        this.pwd = resolvedPath;
        break;
      }


      default:
        this.terminal.writeln(`Command not found: ${command}`);
    }
  }
}
