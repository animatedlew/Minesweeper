class Game {
  constructor(tableSize, cellSize, totalBombs) {
    this.tableSize = tableSize || 10;
    this.cellSize = cellSize || 40;
    this.totalBombs = totalBombs || 10;
    this.onReset();
  }
  onReset() {
    this.setupTable();
    this.setupCells();
    this.setupBombs(this.totalBombs);
    this.setupClues();
    this.isRunning = true;
  }
  setupTable(columns, rows) {

    let table = document.querySelector('.table');
    if (table) document.body.removeChild(table);

    table = document.createElement('div');
    table.classList.add('table');
    table.style.width = (this.cellSize * this.tableSize) + 'px';
    document.body.appendChild(table);

    for (let i = 0; i < this.tableSize; i++) {
      for (let j = 0; j < this.tableSize; j++) {
        let div = document.createElement('div');
        div.classList.add('cell');
        div.setAttribute('row', i);
        div.setAttribute('col', j);
        div.classList.add('cell-'+i+'-'+j);
        table.appendChild(div);
      }
    }

    table.addEventListener('mousedown', this.onClick.bind(this));
    document.body.addEventListener('contextmenu', e => e.preventDefault());

    if (!this.status) {
      this.status = document.createElement('div');
      this.status.classList.add('status');
      document.body.appendChild(this.status);
    }

    this.status.textContent = 'Game on! Left click to reveal, right click to flag.';

    if (!this.reset) {
      this.reset = document.createElement('div');
      this.reset.classList.add('reset');
      this.reset.textContent = 'Reset';
      document.body.appendChild(this.reset);
      this.reset.addEventListener('click', this.onReset.bind(this));
    }
  }
  onClick(e) {
    if (this.isRunning) {
      let t = e.target;      
      let row = +t.getAttribute('row');
      let col = +t.getAttribute('col');
      let cell = this.cells[row][col];
      switch(e.which) {
        case 1:
          this.revealCells(cell, this.getBorderPositions(col, row), () => {
            t.classList.add("bomb");
            this.status.textContent = 'You lose!';
            this.isRunning = false;
          });
          this.checkTable(() => {
            this.status.textContent = 'You won!';
            this.isRunning = false;
          });
          break;
        case 3:
          if (cell.isHidden) {
            let isFlag = t.classList.contains("flag");
            if (isFlag) t.classList.remove("flag");
            else t.classList.add("flag");
            cell.isFlag = !cell.isFlag;
          }
          break;
        default:
          break;
      }
    }
  }
  revealCells(cell, border, callback) {
    if (!cell.isFlag) {
      let el = document.getElementsByClassName(cell.id)[0];
      el.classList.remove("hidden");
      cell.isHidden = false;
      if (!cell.bombCount)
        border.forEach(c => this.revealCells(c, this.getBorderPositions(c.pos.x, c.pos.y), callback));
      if (cell.isBomb && typeof callback == "function")
        callback();
    }
  }
  checkTable(callback) {
    let hiddenCount = this.cells
      .map(row => row
      .reduce((sum, c) => sum + (c.isHidden | 0), 0))
      .reduce((sum, n) => sum + n, 0);
    console.log(">> " + hiddenCount);
    if (typeof callback == "function" && hiddenCount == this.totalBombs)
      callback();
  }
  setupCells() {
    this.cells = [];
    for (let i = 0; i < this.tableSize; i++) {
      let row = [];
      for (let j = 0; j < this.tableSize; j++) {
        let id = 'cell-' + i + '-' + j;
        row.push({
          pos: { x: j, y: i },
          id: id,
          bombCount: 0,
          isFlag: false,
          isBomb: false,
          isHidden: true
        });
        let el = document.getElementsByClassName(id)[0];
        el.classList.add("hidden");
      }
      this.cells.push(row);
    }
  }
  setupBombs(total) {
    if (total) {
      let index =  (Math.random() * this.tableSize * this.tableSize) | 0;
      let row = index / this.tableSize | 0;
      let col = index % this.tableSize;
      let cell = this.cells[row][col];
      if (!cell.isBomb) {
        cell.isBomb = true;
        console.log("bomb @ " + row + ", " + col);
        this.setupBombs(total - 1);
      } else this.setupBombs(total);
    }
  }
  getBorderPositions(x, y) {

    if (x == null || y == null) return;

    let ups = {
      upleft: this.cells[y-1] || null,
      up: this.cells[y-1] || null,
      upright: this.cells[y-1] || null,      
    };
    
    if (ups.upleft) ups.upleft = ups.upleft[x-1];
    if (ups.up) ups.up = ups.up[x];
    if (ups.upright) ups.upright = ups.upright[x+1];
    
    let downs = {
      downleft: this.cells[y+1] || null,
      down: this.cells[y+1] || null,
      downright: this.cells[y+1] || null,   
    };
    
    if (downs.downleft) downs.downleft = downs.downleft[x-1];
    if (downs.down) downs.down = downs.down[x];
    if (downs.downright) downs.downright = downs.downright[x+1];

    let sides = {
      left: this.cells[y][x-1] || null,
      right: this.cells[y][x+1] || null
    };

    return [
      ups.upleft,
      ups.up,
      ups.upright,
      sides.left, sides.right,
      downs.downleft, 
      downs.down, 
      downs.downright
    ].filter(cell => cell && cell.isHidden && !cell.isFlag);
  }
  setupClues() {
    for (let i = 0; i < this.tableSize; i++) {
      for (let j = 0; j < this.tableSize; j++) {
        let pos = this.getBorderPositions(j, i);
        let bombCount = pos.reduce((sum, n) => sum + ((n && n.isBomb) | 0), 0);
        let cell = this.cells[i][j];
        cell.bombCount = bombCount;
        let el = document.getElementsByClassName(cell.id)[0];
        el.dataset.bombCount = bombCount;
        if (bombCount) el.classList.add("bomb-count");
      }
    }
  }
}

window.onload = e => new Game(10, 40, 10);