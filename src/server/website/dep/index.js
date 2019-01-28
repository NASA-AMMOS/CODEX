class SyntheticEventDispatcher {
    constructor() {
        this.handlers = {}
    }

    dispatch(ev, data) {
        if (!this.handlers[ev]) {
            return
        }

        // dispatch closures
        for (let fn of this.handlers[ev]) {
            window.requestAnimationFrame(() => fn(data))
        }
    }

    on(ev, fn) {
        if (!this.handlers[ev]) {
            this.handlers[ev] = []
        }

        this.handlers[ev].push(fn)
    }
}

class ErrorWindow extends HTMLElement {
    constructor() {
        super()
        this.classList.add('error-window')
        this.classList.add('error-window--hidden')

        this.error_title = document.createElement('div')
        this.error_title.textContent = 'title text content'
        this.error_title.classList.add('error-window__title')
        this.appendChild(this.error_title)

        this.error_body = document.createElement('div')
        this.error_body.textContent = 'error body'
        this.error_body.classList.add('error-window__body')
        this.appendChild(this.error_body)
    }

    show(title, body) {
        this.error_title.textContent = title
        this.error_body.textContent = body

        this.classList.remove('error-window--hidden')
    }

    hide() {
        this.classList.add('error-window--hidden')
    }
}

customElements.define('error-window', ErrorWindow)

class ControlDrawer extends HTMLElement {
    constructor() {
        super()
        
        this.classList.add('control-drawer')

        this.drawerHandle = document.createElement('div')
        this.drawerHandle.classList.add('control-drawer__handle')
        this.drawerHandle.addEventListener('click', this.clickDrawerHandle.bind(this))
        this.appendChild(this.drawerHandle)

        
        this.drawer = document.createElement('div')
        this.drawer.classList.add('control-drawer__drawer')
        this.appendChild(this.drawer)

        this.toggleCrossDepsBtn = document.createElement('span')
        this.toggleCrossDepsBtn.classList.add('control-drawer__button')
        this.toggleCrossDepsBtn.textContent = 'toggle cross dependencies'
        this.toggleCrossDepsBtn.addEventListener('click', this.toggleCrossDeps.bind(this))
        this.drawer.appendChild(this.toggleCrossDepsBtn)

        this.toggleCircDepsBtn = document.createElement('span')
        this.toggleCircDepsBtn.classList.add('control-drawer__button')
        this.toggleCircDepsBtn.textContent = 'toggle circular dependencies'
        this.toggleCircDepsBtn.addEventListener('click', this.toggleCircDeps.bind(this))
        this.drawer.appendChild(this.toggleCircDepsBtn)
    }

    clickDrawerHandle() {
        this.classList.toggle('control-drawer--active')
        this.updateButtonStates()
    }

    toggleCircDeps() {
        document.querySelector('#circ-deps').classList.toggle('disabled')
        this.updateButtonStates()
    }

    toggleCrossDeps() {
        document.querySelector('#cross-deps').classList.toggle('disabled')
        this.updateButtonStates()
    }

    updateButtonStates() {
        if (document.querySelector('#circ-deps').classList.contains('disabled')) {
            this.toggleCircDepsBtn.classList.remove('control-drawer__button--active')
        } else {
            this.toggleCircDepsBtn.classList.add('control-drawer__button--active')
        }
        if (document.querySelector('#cross-deps').classList.contains('disabled')) {
            this.toggleCrossDepsBtn.classList.remove('control-drawer__button--active')
        } else {
            this.toggleCrossDepsBtn.classList.add('control-drawer__button--active')
        }
    }
}
customElements.define('control-drawer', ControlDrawer)

class InfoBar extends HTMLElement {
    constructor() {
        super()
        window.infoEvents = new SyntheticEventDispatcher()
        infoEvents.on('select', this.setFile.bind(this))

        this.createUI()
    }

    createUI() {
        // set up ui
        this.classList.add('info-bar')

        this.basename = document.createElement('span')
        this.basename.textContent = 'Click to select an element.'
        this.basename.classList.add('info-bar__title')
        this.appendChild(this.basename)

        this.pathshow = document.createElement('span')
        this.pathshow.textContent = ''
        this.pathshow.classList.add('info-bar__subtitle')
        this.appendChild(this.pathshow)

        this.errorWindow = new ErrorWindow()
        this.appendChild(this.errorWindow)
    }

    setFile(data) {
        console.log(data)

        this.errorWindow.hide()
        if (data.type == 'library') {
            this.basename.textContent = data.path
            this.pathshow.textContent = '[library]'
        } else if (data.type == 'error') {
            this.errorWindow.show(
                `${data.basename} @ line ${data.error.lineNumber}`,
                data.error.description
            )
            this.basename.textContent = data.basename
            this.pathshow.textContent = `[${data.path}]`

        } else {
            this.basename.textContent = data.basename
            this.pathshow.textContent = `[${data.path}]`
        }

    }
}

customElements.define('info-bar', InfoBar)
