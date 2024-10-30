describe('template spec', () => {
    beforeEach(() => {
        Cypress.on('uncaught:exception', (err) => {
            if(err.message.includes("Failed to set the 'files' property on 'HTMLInputElement': Failed to convert value to 'FileList'."))
                return false;
        });
        cy.visit('http://127.0.0.1:5173/PDFinsanity');
    });
    it('Loads the document successfully', () => {
        cy.get('input[type=file]').selectFile('testFiles/testFile1.pdf', { force: true });
        cy.get("div[class='DocumentListItem']").contains('testFile1').should('exist');
    });
    it('Displays document pages', () => {
        cy.get('input[type=file]').selectFile('testFiles/testFile1.pdf', { force: true });
        cy.get("div[class='DocumentListItem']").contains('testFile1').should('exist');
        cy.get("div[class='DocumentListItem']").dblclick();
        cy.get('.PageList').children('.PageThumbnail-container').should('have.length', 4);
    });
    it('Deletes a page from test document', () => {
        cy.get('input[type=file]').selectFile('testFiles/testFile1.pdf', { force: true });
        cy.get("div[class='DocumentListItem']").contains('testFile1').should('exist');
        cy.get("div[class='DocumentListItem']").dblclick();
        cy.get('.PageList').children('.PageThumbnail-container').eq(0).click();
        cy.get('.DocumentManager-action').contains('Delete').click();
        cy.get('.PageList').children('.PageThumbnail-container').should('have.length', 3)
    });
    it('Clones a page from test document', () => {
        cy.get('input[type=file]').selectFile('testFiles/testFile1.pdf', { force: true });
        cy.get("div[class='DocumentListItem']").contains('testFile1').should('exist');
        cy.get("div[class='DocumentListItem']").dblclick();
        cy.get('.PageList').children('.PageThumbnail-container').eq(0).click();
        cy.get('.DocumentManager-action').contains('Clone').click();
        cy.get('.PageList').children('.PageThumbnail-container').should('have.length', 5)
    });
    it('Extracts a page from test document', () => {
        cy.get('input[type=file]').selectFile('testFiles/testFile1.pdf', { force: true });
        cy.get("div[class='DocumentListItem']").contains('testFile1').should('exist');
        cy.get("div[class='DocumentListItem']").dblclick();
        cy.get('.PageList').children().eq(0).click();
        cy.get('.DocumentManager-action').contains('Extract as').click();
        cy.get('.RenameModal-form').type('testFile2');
        cy.get('.Modal-action').contains('Confirm').click();
        cy.get("div[class='DocumentListItem']").contains('testFile1').should('exist');
    });
    it('Imports multiple documents', () => {
        cy.get('input[type=file]').selectFile(['testFiles/testFile1.pdf', 'testFiles/testFile2.pdf'], { force: true });
        cy.get("div[class='DocumentListItem']").contains('testFile1').should('exist');
        cy.get("div[class='DocumentListItem']").contains('testFile2').should('exist');
    });
    it('Merges multiple documents', () => {
        cy.get('input[type=file]').selectFile(['testFiles/testFile1.pdf', 'testFiles/testFile2.pdf'], { force: true });
        cy.get("div[class='DocumentListItem']").click({ multiple: true, ctrlKey: true })
        cy.get('div[class="MainPanel-action"]').contains('Merge').click();
        cy.get('.RenameModal-form').type('testFile3');
        cy.get('.Modal-action').contains('Confirm').click();
        cy.get("div[class='DocumentListItem']").contains('testFile3').should('exist');
    })
    afterEach(() => {
        cy.wait(500);
    })
})