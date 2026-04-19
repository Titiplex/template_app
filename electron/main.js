const {app, BrowserWindow, ipcMain} = require('electron/main')
const {updateElectronApp} = require('update-electron-app')
const path = require('node:path')
const {prisma} = require('./db')

updateElectronApp()

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    win.loadFile(path.join(__dirname, '../dist/renderer/src/index.html'))
    win.webContents.openDevTools()
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    ipcMain.handle('ping', () => 'pong')

    ipcMain.handle('db:account:list', async () => {
        return prisma.account.findMany({
            orderBy: {createdAt: 'desc'},
        })
    })

    ipcMain.handle('db:account:create', async (_event, data) => {
        return prisma.account.create({
            data: {
                name: data.name,
                type: data.type,
                currency: data.currency ?? 'CAD',
                description: data.description ?? null,
            },
        })
    })

    ipcMain.handle('db:category:list', async () => {
        return prisma.category.findMany({
            orderBy: {name: 'asc'},
        })
    })

    ipcMain.handle('db:category:create', async (_event, data) => {
        return prisma.category.create({
            data: {
                name: data.name,
                kind: data.kind,
                color: data.color ?? null,
                description: data.description ?? null,
            },
        })
    })

    ipcMain.handle('db:transaction:list', async () => {
        return prisma.transaction.findMany({
            include: {
                account: true,
                category: true,
            },
            orderBy: {date: 'desc'},
        })
    })

    ipcMain.handle('db:transaction:create', async (_event, data) => {
        return prisma.transaction.create({
            data: {
                label: data.label,
                amount: Number(data.amount),
                kind: data.kind,
                date: new Date(data.date),
                note: data.note ?? null,
                accountId: Number(data.accountId),
                categoryId: data.categoryId ? Number(data.categoryId) : null,
            },
            include: {
                account: true,
                category: true,
            },
        })
    })
})

app.on('window-all-closed', async () => {
    await prisma.$disconnect()
    if (process.platform !== 'darwin') {
        app.quit()
    }
})