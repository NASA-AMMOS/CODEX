window.codex = new BootlegCodex('localhost:8888')

const get_el = from => document.querySelector(`[data-from="${from}"]`)

const showSession = () => {
    get_el('session')
        .innerHTML = codex.session
}

const showFeature = feat => {
    get_el('feature_length')
        .innerText = feat.length

    get_el('feature_head')
        .innerText = feat.slice(0, Math.min(10, feat.length - 1)).join(', ')
}

const showFeaturesList = () => {
    let html = codex.features
        .map(f => `<li>${f}</li>`)
        .reduce((a,v) => a + v, '')

    let select_html = codex.features
        .map(f => `<option value="${f}">${f}</option>`)
        .reduce((a,v) => a + v, '')

    get_el('features')
        .innerHTML = html

    get_el('features_select')
        .innerHTML = select_html
}

const uploadFile = e => {
    const file = document.querySelector('#file').files[0]

    //const file = e.target.files[0]

    codex.upload_file(file)
        .then(() => {
            showFeaturesList()
        })

}

document.querySelector('#get_feature')
    .addEventListener('submit', async e => {
        e.preventDefault()

        const name = document.querySelector('[name="feature"]').value
        const sample_txt = document.querySelector('[name="downsample"]').value

        console.log('submitting ', name, sample_txt)

        const sample = (sample_txt === '') ? null : parseInt(sample_txt)

        const feat = await codex.get_feature(name, sample)
        showFeature(feat)
    })



document.querySelector('#file')
    .addEventListener('change', uploadFile)

document.querySelector('#upload')
    .addEventListener('click', uploadFile)

window.onload = () => {
    showSession()
}
