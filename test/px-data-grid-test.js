const data = [{
  'first': 'Elizabeth',
  'last': 'Wong',
  'email': 'sika@iknulber.cl'
}, {
  'first': 'Jeffrey',
  'last': 'Hamilton',
  'email': 'cofok@rac.be'
}, {
  'first': 'Alma',
  'last': 'Martin',
  'email': 'dotta@behtam.la'
}, {
  'first': 'Carl',
  'last': 'Saunders',
  'email': 'seh@bibapu.gy'
}, {
  'first': 'Willie',
  'last': 'Dennis',
  'email': 'izko@dahokwej.ci'
}];


document.addEventListener('WebComponentsReady', function() {
  runTests();
});


function runTests() {

  describe('Unit Tests for px-data-grid', () => {
    let grid;
    let timeoutSpy;

    function getRows() {
      return grid._vaadinGrid.$.items.querySelectorAll('tr');
    }

    function getVisibleRows() {
      // the following querySelector fails on safari for some reason
      // return grid._vaadinGrid.$.items.querySelectorAll('tr:not([hidden]');
      const rows = getRows();
      const visibleRows = Array.prototype.filter.call(rows, function(row) {
        return row.getAttribute('hidden') !== ''
            && row.getAttribute('hidden') !== true;
      });
      return visibleRows;
    }

    function getRowCells(row) {
      return Array.prototype.slice.call(Polymer.dom(row).querySelectorAll('[part~="cell"]'));
    }

    function flushVaadinGrid() {
      const vaadinGrid = grid.shadowRoot.querySelector('vaadin-grid');
      Polymer.flush();
      vaadinGrid._observer.flush();
      Polymer.flush();
      if (vaadinGrid._debounceScrolling) {
        vaadinGrid._debounceScrolling.flush();
      }
      if (vaadinGrid._debounceScrollPeriod) {
        vaadinGrid._debounceScrollPeriod.flush();
      }
      if (vaadinGrid._debouncerLoad) {
        vaadinGrid._debouncerLoad.flush();
      }
    }

    function getCellContent(cell) {
      const slot = cell.querySelector('slot');
      const slotName = slot.getAttribute('name');
      const content = grid.shadowRoot.querySelector('[slot="' + slotName + '"]');
      const wrapper = content.querySelector('div');
      return wrapper.innerHTML;
    }

    function getHeaderCell(grid, index) {
      return grid._vaadinGrid.$.header.querySelectorAll('[part~="cell"]')[index];
    }

    function getHeaderCellContent(cell) {
      return cell ? cell.querySelector('slot').assignedNodes()[0].querySelector('px-data-grid-header-cell') : null;
    }

    beforeEach((done) => {
      grid = fixture('simple-grid');
      grid.tableData = data;

      Polymer.RenderStatus.afterNextRender(grid, () => {
        setTimeout(() => { // IE11
          done();
        });
      });
    });

    describe('simple-grid tests', () => {
      it('should properly populate columns', () => {
        expect(grid.columns.length).to.be.eql(3);
        expect(grid.columns[0].name).to.be.eql('first');
        expect(grid.columns[1].name).to.be.eql('last');
        expect(grid.columns[2].name).to.be.eql('email');
      });
    });

    describe('spinner', () => {
      function createTimeoutSpy() {
        timeoutSpy = sinon.spy(window, 'setTimeout');

        grid.remoteDataProvider = () => {};

        const call = timeoutSpy.getCalls().filter(call => call.returnValue === grid._spinnerHiddenTimeout)[0];
        return call.args;
      }

      it('should set _spinnerHiddenTimeout when assigning remoteDataProvider', () => {
        grid.remoteDataProvider = (params, callback) => {};
        expect(grid._spinnerHiddenTimeout).to.be.ok;
      });

      it('should hide spinner unless 500ms have passed', () => {
        grid.remoteDataProvider = (params, callback) => {};
        expect(grid.shadowRoot.querySelector('px-spinner').hasAttribute('hidden')).to.be.true;
      });

      it('should have proper timeout', () => {
        grid.loadingSpinnerDebounce = 1000;
        const timeout = createTimeoutSpy()[1];

        expect(timeout).to.equal(1000);
        timeoutSpy.restore();
      });

      it('should show spinner after 500ms when data is loading', () => {
        const timeoutCallback = createTimeoutSpy()[0];

        timeoutCallback();
        expect(grid.shadowRoot.querySelector('px-spinner').hasAttribute('hidden')).to.be.false;
        timeoutSpy.restore();
      });
    });

    describe('selection', () => {
      beforeEach((done) => {
        flushVaadinGrid();
        window.flush(done);
      });

      it('should add the item to selectedItems when row is clicked', (done) => {
        grid.selectable = true;
        grid.multiSelect = true;
        Polymer.RenderStatus.afterNextRender(grid, () => {
          expect(grid.selectedItems).to.eql([]);
          const rows = getRows();
          let cell = getRowCells(rows[1])[0];
          cell.click();
          Polymer.RenderStatus.afterNextRender(grid, () => {
            expect(grid.selectedItems).to.eql([data[1]]);
            cell = getRowCells(rows[2])[0];
            cell.click();
            Polymer.RenderStatus.afterNextRender(grid, () => {
              expect(grid.selectedItems).to.eql([data[1], data[2]]);
              done();
            });
          });
        });
      });
    });

    describe('single selection', () => {
      beforeEach((done) => {
        flushVaadinGrid();
        window.flush(done);
      });

      it('should only have one item in selectedItems when rows have been clicked', (done) => {
        expect(grid.selectedItems).to.eql([]);
        grid.selectable = true;
        grid.multiSelect = false;
        Polymer.RenderStatus.afterNextRender(grid, () => {
          const rows = getRows();
          let cell = getRowCells(rows[1])[1];
          cell.click();
          Polymer.RenderStatus.afterNextRender(grid, () => {
            expect(grid.selectedItems).to.eql([data[1]]);
            cell = getRowCells(rows[2])[1];
            cell.click();
            Polymer.RenderStatus.afterNextRender(grid, () => {
              expect(grid.selectedItems).to.eql([data[2]]);
              done();
            });
          });
        });
      });
    });

    describe('highlighting', () => {
      beforeEach((done) => {
        flushVaadinGrid();
        window.flush(done);
      });

      it('should highlight cell', () => {
        grid.highlight = [{
          type: 'cell',
          color: 'red',
          condition: (cellData, column, item) => {
            return cellData === 'Alma';
          }
        }];

        expect(grid._getCellStyle(data[2], grid.columns[0])).to.eql('background: red');
      });

      it('should highlight row', () => {
        grid.highlight = [{
          type: 'row',
          color: 'yellow',
          condition: (cellData, item) => {
            return cellData === 'Saunders';
          }
        }];

        expect(grid._getCellStyle(data[3], grid.columns[0])).to.eq('background: yellow');
        expect(grid._getCellStyle(data[3], grid.columns[1])).to.eq('background: yellow');
        expect(grid._getCellStyle(data[3], grid.columns[2])).to.eq('background: yellow');
      });

      it('should highlight column', () => {
        grid.highlight = [{
          type: 'column',
          color: 'blue',
          condition: (column, item) => {
            return column.name === 'first';
          }
        }];

        data.forEach((d) => {
          expect(grid._getCellStyle(d, grid.columns[0])).to.eq('background: blue');
        });
      });
    });

    describe('manually passed columns', () => {
      const columns = [
        {
          name: 'first',
          header: 'First Name',
          value: (item) => {
            return item.first;
          }
        },
        {
          name: 'last',
          header: 'Last Name',
          value: (item) => {
            return item.last;
          }
        },
        {
          name: 'email',
          header: 'Email',
          value: (item) => {
            return item.email;
          }
        },
        {
          header: 'Hidden column',
          hidden: true,
          value: (item) => {
            return 'hidden data';
          }
        }
      ];

      it('should change generated column to manually passed', () => {
        grid.columns = columns;
        flushVaadinGrid();
        expect(grid._vaadinGrid.querySelectorAll('px-data-grid-column').length).to.be.eq(4);
      });
    });

    describe('column dropdown menu', () => {
      let firstNameHeaderCell;
      let lastNameHeaderCell;

      beforeEach(() => {
        firstNameHeaderCell = getHeaderCell(grid, 0);
        lastNameHeaderCell = getHeaderCell(grid, 1);
      });

      it('should move the first frozen column to the left side of the grid', () => {
        getHeaderCellContent(lastNameHeaderCell)._freezeColumn();
        expect(getHeaderCell(grid, 0)).to.equal(lastNameHeaderCell);
        expect(getHeaderCell(grid, 1)).to.equal(firstNameHeaderCell);
      });

      it('should move the second frozen column to the left side of the grid, before the first frozen', () => {
        getHeaderCellContent(lastNameHeaderCell)._freezeColumn();
        getHeaderCellContent(firstNameHeaderCell)._freezeColumn();
        expect(getHeaderCell(grid, 0)).to.equal(firstNameHeaderCell);
        expect(getHeaderCell(grid, 1)).to.equal(lastNameHeaderCell);
      });

      // TODO: @limonte investigate why 2 tests below don't work
      // it('should move the first unfrozen column right after last frozen', () => {
      //   getHeaderCellContent(lastNameHeaderCell)._freezeColumn();
      //   getHeaderCellContent(firstNameHeaderCell)._freezeColumn();
      //   getHeaderCellContent(firstNameHeaderCell)._unfreezeColumn();
      //   expect(getHeaderCell(grid, 0)).to.equal(lastNameHeaderCell);
      //   expect(getHeaderCell(grid, 1)).to.equal(firstNameHeaderCell);
      // });

      // it('should not change columns order after unfrozing the only one frozen column', () => {
      //   getHeaderCellContent(lastNameHeaderCell)._freezeColumn();
      //   getHeaderCellContent(firstNameHeaderCell)._freezeColumn();
      //   getHeaderCellContent(firstNameHeaderCell)._unfreezeColumn();
      //   getHeaderCellContent(lastNameHeaderCell)._unfreezeColumn();
      //   expect(getHeaderCell(grid, 0)).to.equal(lastNameHeaderCell);
      //   expect(getHeaderCell(grid, 1)).to.equal(firstNameHeaderCell);
      // });

      it('should hide the column', () => {
        getHeaderCellContent(firstNameHeaderCell)._hideColumn();
        expect(firstNameHeaderCell.hasAttribute('hidden')).to.be.true;
      });
    });

    describe('local data source', () => {

      beforeEach((done) => {
        grid = fixture('simple-grid');
        grid.tableData = data;

        Polymer.RenderStatus.afterNextRender(grid, () => {
          setTimeout(() => { // IE11
            done();
          });
        });
      });

      it('cell values in DOM should match that of the local data source', () => {
        getRows().forEach((row, rowIndex) => {
          getRowCells(row).forEach((cell, cellIndex) => {
            // compare value we find in DOM and value in our data object
            const dataRow = data[rowIndex];
            const expectedVal = dataRow[Object.keys(dataRow)[cellIndex]];
            const domVal = getCellContent(cell);
            expect(domVal).to.be.eql(expectedVal);
          });
        });
      });

    });

    describe('auto filter field tests', () => {

      beforeEach((done) => {
        grid = fixture('simple-grid');
        grid.tableData = data;
        grid.autoFilter = true;

        Polymer.RenderStatus.afterNextRender(grid, () => {
          setTimeout(() => { // IE11
            done();
          });
        });
      });

      it('should show only 1 row after filtering', (done) => {
        const autoFilter = grid.shadowRoot.querySelector('px-auto-filter-field');
        autoFilter.addEventListener('filter-change', function(event) {
          expect(getVisibleRows().length).to.be.eql(1);
          done();
        });
        autoFilter.value = 'Elizabeth';
      });

      it('should show 2 rows after filtering', (done) => {
        const autoFilter = grid.shadowRoot.querySelector('px-auto-filter-field');
        autoFilter.addEventListener('filter-change', function(event) {
          expect(getVisibleRows().length).to.be.eql(2);
          done();
        });
        autoFilter.value = 'am';
      });

      it('should show all rows when filter value is empty', (done) => {
        const autoFilter = grid.shadowRoot.querySelector('px-auto-filter-field');
        // set filter with value to reduce # of visible rows
        autoFilter.value = 'am';
        // give 500ms to let rows update
        setTimeout(function() {
          // add listener and clear filter value to let all rows become visible
          autoFilter.addEventListener('filter-change', function(event) {
            expect(getVisibleRows().length).to.be.eql(data.length);
            done();
          });
          autoFilter.value = '';
        }, autoFilter.timeout + 100);
      });

    });

  });
}
