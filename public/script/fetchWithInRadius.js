import { db, ref, onValue } from "./fbmodule.js";

var code1=(className)=>{

	return `
<div class="accordion-item">
	<h2 class="accordion-header" id="heading">
		<button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${className}"
			aria-expanded="true" aria-controls="${className}">
				<b>${className}</b>
		</button>
	</h2>
	<div id="${className}" class="accordion-collapse collapse show" aria-labelledby="headingOne"
		data-bs-parent="#accordionExample">
		<div class="accordion-body">
			<p id="table">

				<table class="table">
				
					<tr class="table-light" >
						<th>Roll no</button></th>
						<th>Distance</button></th>
						<th>Reporting Time</button> </th>
					</tr>

`;
}


var code3=
`


			</table>
			</p>
		</div>
	</div>
</div>
`;

const attendanceRef = ref(db, `attendance/`);
onValue(attendanceRef, (snapshot) => {
	document.getElementById("loader").style.display='none';
	const classesList = snapshot.val();
	var code2=``;

	for (const [className, data] of Object.entries(classesList)) {
		for (const [rollNo,studentData] of Object.entries(data)) {
			


			if(parseInt(studentData.distance)<=10){
			
		code2 += `
            <tr class="table-light">
              <td >${rollNo}</td>
                <td >${studentData.distance} meters</td>
                <td >${studentData.time}</td>
            </tr>
            
            `;


			
			}
			
		}
		
		var code4 = code1(className) + code2 + code3;

		document.getElementById("accordionExample").innerHTML += code4;
		
	}
	
	
	

});
